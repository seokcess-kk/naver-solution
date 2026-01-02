import puppeteer, { Browser, Page } from 'puppeteer';
import {
  INaverScrapingService,
  NaverRankingResult,
  NaverReviewResult,
} from './interfaces/INaverScrapingService';

export class NaverScrapingService implements INaverScrapingService {
  private browser: Browser | null = null;
  private readonly headless: boolean;
  private readonly timeout: number;
  private readonly delay: number;

  constructor() {
    this.headless = process.env.PUPPETEER_HEADLESS !== 'false';
    this.timeout = parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10);
    this.delay = parseInt(process.env.NAVER_SCRAPING_DELAY || '2000', 10);
  }

  /**
   * Ensure browser instance is initialized (lazy loading)
   */
  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  /**
   * Scrape ranking for a place from Naver search results
   */
  async scrapeRanking(
    keyword: string,
    region: string | null,
    targetPlaceId: string
  ): Promise<NaverRankingResult> {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      // Build search query
      const searchQuery = region ? `${keyword} ${region}` : keyword;
      const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(searchQuery)}`;

      console.log(`[NaverScrapingService] Scraping: ${searchUrl}`);

      // Navigate with retry logic
      await this.navigateWithRetry(page, searchUrl);

      // Wait for place results section to load with multiple possible selectors
      const placeSectionSelectors = [
        '.place_section',
        '#place-main-section',
        '.list_place',
        '.area_place',
        '.place_box',
        '#_place_list',
        '.place_bluelink',
        '[data-cid]',
      ];

      let placeSectionFound = false;
      for (const selector of placeSectionSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`[NaverScrapingService] Place section found with selector: ${selector}`);
          placeSectionFound = true;
          break;
        } catch {
          continue;
        }
      }

      if (!placeSectionFound) {
        console.warn('[NaverScrapingService] Place section not found with any known selector');

        // Debug: Log available elements for investigation
        if (process.env.PUPPETEER_DEBUG === 'true') {
          const bodyHTML = await page.evaluate(() => {
            // @ts-ignore - document is available in browser context
            return document.body.innerHTML;
          });
          console.log('[NaverScrapingService] Page HTML (first 1000 chars):', bodyHTML.substring(0, 1000));
        }

        return {
          rank: null,
          searchResultCount: null,
          found: false,
        };
      }

      // Extract search result count
      const searchResultCount = await this.extractResultCount(page);

      // Find rank for target place
      const rank = await this.findPlaceRank(page, targetPlaceId);

      // Add delay before next request (rate limiting)
      await this.sleep(this.delay);

      console.log(
        `[NaverScrapingService] Result: rank=${rank}, resultCount=${searchResultCount}`
      );

      return {
        rank,
        searchResultCount,
        found: rank !== null,
      };
    } catch (error) {
      console.error('[NaverScrapingService] Scraping error:', error);
      return {
        rank: null,
        searchResultCount: null,
        found: false,
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Navigate to URL with retry logic (exponential backoff)
   */
  private async navigateWithRetry(page: Page, url: string, retries = 2): Promise<void> {
    for (let i = 0; i <= retries; i++) {
      try {
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: this.timeout,
        });
        return;
      } catch (error) {
        if (i === retries) {
          throw error;
        }
        const backoffDelay = 1000 * (i + 1); // 1s, 2s
        console.warn(
          `[NaverScrapingService] Navigation failed, retrying in ${backoffDelay}ms...`
        );
        await this.sleep(backoffDelay);
      }
    }
  }

  /**
   * Extract total search result count from page
   */
  private async extractResultCount(page: Page): Promise<number | null> {
    try {
      // Try multiple possible selectors
      const selectors = ['.result_number', '.title_area .num', '.search_number'];

      for (const selector of selectors) {
        try {
          const countText = await page.$eval(selector, (el) => el.textContent);
          if (countText) {
            const match = countText.match(/[\d,]+/);
            if (match) {
              return parseInt(match[0].replace(/,/g, ''), 10);
            }
          }
        } catch {
          // Try next selector
          continue;
        }
      }

      return null;
    } catch (error) {
      console.warn('[NaverScrapingService] Could not extract result count');
      return null;
    }
  }

  /**
   * Find ranking position of target place in search results
   */
  private async findPlaceRank(page: Page, targetPlaceId: string): Promise<number | null> {
    try {
      // Try multiple possible selectors for place items
      const placeItemSelectors = [
        '.place_bluelink',
        '.place_item',
        '.item',
        '[data-place-id]',
        '[data-cid]',
        'li[data-index]',
        '.search_item.place',
        '.Gm6xw',  // Naver often uses auto-generated class names
      ];

      let placeItems: any[] = [];
      for (const selector of placeItemSelectors) {
        placeItems = await page.$$(selector);
        if (placeItems.length > 0) {
          console.log(`[NaverScrapingService] Found ${placeItems.length} place items with selector: ${selector}`);
          break;
        }
      }

      if (placeItems.length === 0) {
        console.warn('[NaverScrapingService] No place items found with any known selector');

        // Debug: Log available anchors for investigation
        if (process.env.PUPPETEER_DEBUG === 'true') {
          const anchors = await page.$$eval('a', (links) =>
            links.slice(0, 10).map((link) => link.href)
          );
          console.log('[NaverScrapingService] Sample anchor hrefs:', anchors);
        }

        return null;
      }

      // Iterate through results to find target place
      for (let i = 0; i < placeItems.length; i++) {
        const placeId = await placeItems[i].evaluate((el: any) => {
          // Try to extract place ID from various sources
          const dataCid = el.getAttribute('data-cid');
          if (dataCid) return dataCid;

          const dataPlaceId = el.getAttribute('data-place-id');
          if (dataPlaceId) return dataPlaceId;

          // Try to find in link href (support multiple URL patterns)
          const link = el.querySelector('a') || el;
          if (link) {
            const href = link.getAttribute('href') || '';

            // Pattern 1: /place/123456789
            let match = href.match(/\/place\/(\d+)/);
            if (match) return match[1];

            // Pattern 2: ?id=123456789
            match = href.match(/[?&]id=(\d+)/);
            if (match) return match[1];

            // Pattern 3: data-cid in child element
            const cidElement = link.querySelector('[data-cid]');
            if (cidElement) return cidElement.getAttribute('data-cid');
          }

          return null;
        });

        if (placeId === targetPlaceId) {
          console.log(`[NaverScrapingService] Found target place at rank ${i + 1}`);
          return i + 1; // Rank is 1-based
        }
      }

      console.warn(`[NaverScrapingService] Place ID ${targetPlaceId} not found in ${placeItems.length} results`);
      return null; // Not found
    } catch (error) {
      console.error('[NaverScrapingService] Error finding place rank:', error);
      return null;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Scrape reviews from Naver Place page
   */
  async scrapeReviews(
    naverPlaceId: string,
    limit: number = 10
  ): Promise<NaverReviewResult[]> {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      // Build Naver Place URL
      const placeUrl = `https://pcmap.place.naver.com/place/${naverPlaceId}`;
      console.log(`[NaverScrapingService] Scraping reviews: ${placeUrl}`);

      // Navigate with retry
      await this.navigateWithRetry(page, placeUrl);

      // Wait for review section to load
      try {
        await this.waitForReviewSection(page);
      } catch (error) {
        console.warn('[NaverScrapingService] Review section not found');
        return []; // Graceful degradation
      }

      // Extract reviews
      const reviews = await this.extractReviews(page, limit);

      // Rate limiting
      await this.sleep(this.delay);

      console.log(`[NaverScrapingService] Scraped ${reviews.length} reviews`);
      return reviews;
    } catch (error) {
      console.error('[NaverScrapingService] Review scraping error:', error);
      return []; // Graceful degradation
    } finally {
      await page.close();
    }
  }

  /**
   * Wait for review section to load
   */
  private async waitForReviewSection(page: Page): Promise<void> {
    // Try multiple selectors for review section
    const selectors = ['.review_item', '.place_review_list', '[data-review-id]', '.ReviewItem'];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: this.timeout });
        console.log(`[NaverScrapingService] Review section found with selector: ${selector}`);
        return;
      } catch {
        continue;
      }
    }

    throw new Error('Review section not found');
  }

  /**
   * Extract reviews from page
   */
  private async extractReviews(
    page: Page,
    limit: number
  ): Promise<NaverReviewResult[]> {
    const reviews: NaverReviewResult[] = [];

    try {
      // Try multiple selectors for review items
      const itemSelectors = ['.review_item', '.ReviewItem', '[data-review-id]'];
      let reviewItems: any[] = [];

      for (const selector of itemSelectors) {
        reviewItems = await page.$$(selector);
        if (reviewItems.length > 0) {
          console.log(`[NaverScrapingService] Found ${reviewItems.length} review items with selector: ${selector}`);
          break;
        }
      }

      if (reviewItems.length === 0) {
        console.warn('[NaverScrapingService] No review items found');
        return reviews;
      }

      // Extract data from each review item (up to limit)
      const maxReviews = Math.min(reviewItems.length, limit);
      for (let i = 0; i < maxReviews; i++) {
        try {
          const reviewData = await reviewItems[i].evaluate((el: any) => {
            // Extract review ID (try multiple sources)
            const reviewId =
              el.getAttribute('data-review-id') ||
              el.getAttribute('data-id') ||
              el.querySelector('[data-review-id]')?.getAttribute('data-review-id') ||
              null;

            if (!reviewId) return null;

            // Extract review type (BLOG vs VISITOR)
            let reviewType: 'BLOG' | 'VISITOR' | 'OTHER' = 'OTHER';
            const typeElement = el.querySelector('.review_type, .type_badge, .ReviewType');
            if (typeElement) {
              const typeText = typeElement.textContent?.trim() || '';
              if (typeText.includes('블로그') || typeText.includes('blog')) {
                reviewType = 'BLOG';
              } else if (typeText.includes('방문자') || typeText.includes('visitor') || typeText.includes('방문')) {
                reviewType = 'VISITOR';
              }
            }

            // Extract content
            const contentElement = el.querySelector('.review_content, .comment_text, .ReviewContent');
            const content = contentElement?.textContent?.trim() || null;

            // Extract rating (별점)
            let rating: number | null = null;
            const ratingElement = el.querySelector('.rating, .star_score, [class*="star"]');
            if (ratingElement) {
              const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label') || '';
              const match = ratingText.match(/([1-5])/);
              if (match) {
                rating = parseInt(match[1], 10);
              }
            }

            // Extract author
            const authorElement = el.querySelector('.reviewer_name, .author, .user_name, .ReviewAuthor');
            const author = authorElement?.textContent?.trim() || null;

            // Extract published date
            const dateElement = el.querySelector('.review_date, .date, .publish_date, .ReviewDate');
            const publishedAt = dateElement?.textContent?.trim() || null;

            return {
              naverReviewId: reviewId,
              reviewType,
              content,
              rating,
              author,
              publishedAt,
            };
          });

          if (reviewData && reviewData.naverReviewId) {
            reviews.push({
              naverReviewId: reviewData.naverReviewId,
              reviewType: reviewData.reviewType,
              content: reviewData.content,
              rating: reviewData.rating,
              author: reviewData.author,
              publishedAt: this.parsePublishedDate(reviewData.publishedAt),
            });
          }
        } catch (itemError) {
          // Skip individual review parsing failure
          console.warn(`[NaverScrapingService] Failed to parse review #${i}:`, itemError);
          continue;
        }
      }

      return reviews;
    } catch (error) {
      console.error('[NaverScrapingService] Error extracting reviews:', error);
      return reviews; // Partial success allowed
    }
  }

  /**
   * Parse published date string to Date object
   */
  private parsePublishedDate(dateText: string | null): Date | null {
    if (!dateText) return null;

    try {
      // Case 1: "2025.12.29" 형식
      const dotDateMatch = dateText.match(/(\d{4})\.(\d{2})\.(\d{2})/);
      if (dotDateMatch) {
        return new Date(
          parseInt(dotDateMatch[1], 10),
          parseInt(dotDateMatch[2], 10) - 1,
          parseInt(dotDateMatch[3], 10)
        );
      }

      // Case 2: "3일 전", "1주 전", "2개월 전" 형식
      const relativeMatch = dateText.match(/(\d+)(일|주|개월)[\s]*전/);
      if (relativeMatch) {
        const amount = parseInt(relativeMatch[1], 10);
        const unit = relativeMatch[2];
        const date = new Date();

        if (unit === '일') {
          date.setDate(date.getDate() - amount);
        } else if (unit === '주') {
          date.setDate(date.getDate() - amount * 7);
        } else if (unit === '개월') {
          date.setMonth(date.getMonth() - amount);
        }

        return date;
      }

      // Case 3: "오늘"
      if (dateText.includes('오늘')) {
        return new Date();
      }

      // Case 4: "어제"
      if (dateText.includes('어제')) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      }

      return null;
    } catch (error) {
      console.warn(`[NaverScrapingService] Failed to parse date: ${dateText}`);
      return null;
    }
  }

  /**
   * Close browser and cleanup resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('[NaverScrapingService] Browser closed');
    }
  }
}
