import puppeteer, { Browser, Page, Frame } from 'puppeteer';
import {
  INaverScrapingService,
  NaverRankingResult,
  NaverReviewResult,
  NaverReviewCountsResult,
} from './interfaces/INaverScrapingService';
import {
  ScrapingTimeoutError,
  ScrapingSelectorNotFoundError,
  ScrapingNetworkError,
  InternalServerError,
} from '@application/errors/HttpError';

export class NaverScrapingService implements INaverScrapingService {
  private readonly headless: boolean;
  private readonly timeout: number;
  private readonly delay: number;

  constructor() {
    this.headless = process.env.PUPPETEER_HEADLESS !== 'false';
    this.timeout = parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10);
    this.delay = parseInt(process.env.NAVER_SCRAPING_DELAY || '2000', 10);
  }

  /**
   * Create a new browser instance for each request (per-request lifecycle)
   * This ensures complete isolation and prevents connection closure issues
   */
  private async createBrowser(): Promise<Browser> {
    console.log('[NaverScrapingService] Creating new browser instance...');
    console.log('[NaverScrapingService] Headless mode:', this.headless);

    try {
      const browser = await puppeteer.launch({
        headless: this.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
        ],
      });

      console.log('[NaverScrapingService] Browser launched successfully');
      console.log('[NaverScrapingService] Browser connected:', browser.isConnected());

      return browser;
    } catch (error) {
      console.error('[NaverScrapingService] Failed to launch browser:', error);
      throw error;
    }
  }

  /**
   * Scrape ranking for a place from Naver search results
   */
  async scrapeRanking(
    keyword: string,
    region: string | null,
    targetPlaceId: string
  ): Promise<NaverRankingResult> {
    const browser = await this.createBrowser();
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
      await browser.close();
      console.log('[NaverScrapingService] Browser closed');
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
   * Find the frame containing reviews (main frame or iframe)
   */
  /**
   * Extract review counts from home tab (before clicking review tab)
   *
   * Parses text like "방문자 리뷰 2,123" and "블로그 리뷰 456" to extract counts
   */
  private async extractReviewCounts(page: Page): Promise<import('./interfaces/INaverScrapingService').NaverReviewCountsResult> {
    console.log('[NaverScrapingService] Extracting review counts from home tab...');

    let visitorReviewCount: number | null = null;
    let blogReviewCount: number | null = null;

    const tabSelectors = [
      'a[href*="review"]',
      '.tab_review',
      '[role="tab"]',
      '.place_menu_review',
    ];

    try {
      for (const selector of tabSelectors) {
        const elements = await page.$$(selector);

        if (elements.length === 0) continue;

        for (const element of elements) {
          try {
            const text = await page.evaluate(el => el?.textContent?.trim() || '', element);

            if (!text) continue;

            // Parse visitor review count: "방문자 리뷰 2,123"
            if (text.includes('방문자') && text.includes('리뷰')) {
              const match = text.match(/[\d,]+/);
              if (match) {
                const numberStr = match[0].replace(/,/g, '');
                visitorReviewCount = parseInt(numberStr, 10);
                console.log(`[NaverScrapingService] Found visitor review count: ${visitorReviewCount}`);
              }
            }

            // Parse blog review count: "블로그 리뷰 456"
            if (text.includes('블로그') && text.includes('리뷰')) {
              const match = text.match(/[\d,]+/);
              if (match) {
                const numberStr = match[0].replace(/,/g, '');
                blogReviewCount = parseInt(numberStr, 10);
                console.log(`[NaverScrapingService] Found blog review count: ${blogReviewCount}`);
              }
            }
          } catch (error) {
            // Skip this element and continue
            continue;
          }
        }

        // If we found at least one count, we can stop
        if (visitorReviewCount !== null || blogReviewCount !== null) {
          break;
        }
      }
    } catch (error) {
      console.warn('[NaverScrapingService] Failed to extract review counts:', error);
    }

    const result = { visitorReviewCount, blogReviewCount };
    console.log('[NaverScrapingService] Extracted review counts:', result);
    return result;
  }

  /**
   * Click review tab to load review section
   */
  private async clickReviewTab(page: Page): Promise<void> {
    console.log('[NaverScrapingService] Attempting to click review tab...');

    const reviewTabSelectors = [
      'a[href*="review"]',
      'button[aria-label*="리뷰"]',
      '.tab_review',
      '[role="tab"]',  // Generic tab selector
    ];

    for (const selector of reviewTabSelectors) {
      try {
        // Try to find the review tab element
        const elements = await page.$$(selector);

        for (const element of elements) {
          // Check if this element is the review tab by checking text content
          const text = await page.evaluate(el => el?.textContent?.trim().toLowerCase(), element);

          if (text && (text.includes('리뷰') || text.includes('review'))) {
            console.log(`[NaverScrapingService] Found review tab with selector: ${selector}, text: "${text}"`);
            await element.click();
            console.log('[NaverScrapingService] Review tab clicked');

            // Wait for review content to load
            await this.sleep(2000);
            return;
          }
        }
      } catch (error) {
        // Continue to next selector
        continue;
      }
    }

    console.log('[NaverScrapingService] Review tab not found or already on review page');
  }

  private async findReviewFrame(page: Page): Promise<Frame> {
    const allFrames = page.frames();
    console.log(`[NaverScrapingService] Found ${allFrames.length} frames`);

    // Priority 1: iframe with /review in URL
    let targetFrame = allFrames.find(f => f.url().includes('/review'));
    if (targetFrame) {
      console.log(`[NaverScrapingService] Using review iframe: ${targetFrame.url()}`);
      return targetFrame;
    }

    // Priority 2: iframe with naverPlaceId (excluding main frame)
    const naverPlaceIdFromUrl = page.url().match(/place\/([^/?]+)/)?.[1];
    if (naverPlaceIdFromUrl) {
      targetFrame = allFrames.find(
        f => f.url().includes(naverPlaceIdFromUrl) && f !== page.mainFrame()
      );
      if (targetFrame) {
        console.log(`[NaverScrapingService] Using place iframe: ${targetFrame.url()}`);
        return targetFrame;
      }
    }

    // Priority 3: main frame
    console.log('[NaverScrapingService] Using main frame');
    return page.mainFrame();
  }

  /**
   * Scrape reviews from Naver Place page
   */
  async scrapeReviews(
    naverPlaceId: string,
    limit: number = 10
  ): Promise<{ reviews: NaverReviewResult[]; counts: NaverReviewCountsResult }> {
    const browser = await this.createBrowser();
    const page = await browser.newPage();
    let counts: NaverReviewCountsResult = { visitorReviewCount: null, blogReviewCount: null };

    try {
      // Build Naver Place URL
      const placeUrl = `https://m.place.naver.com/place/${naverPlaceId}`;
      console.log(`[NaverScrapingService] Scraping reviews: ${placeUrl}`);

      // Navigate with retry
      await this.navigateWithRetry(page, placeUrl);

      // Extract review counts from home tab (BEFORE clicking review tab)
      counts = await this.extractReviewCounts(page);

      // Click review tab to load review section
      await this.clickReviewTab(page);

      // Find the frame containing reviews (main frame or iframe)
      const reviewFrame = await this.findReviewFrame(page);

      // Wait for review section to load (with retry)
      try {
        await this.retryWithBackoff(
          () => this.waitForReviewSection(reviewFrame),
          undefined,
          'waitForReviewSection'
        );
      } catch (error: any) {
        if (error instanceof ScrapingSelectorNotFoundError) {
          console.warn('[NaverScrapingService] Review section not found - place may have no reviews');
          return { reviews: [], counts }; // Graceful degradation for "no reviews" case
        }
        // Network errors or other errors should propagate
        throw error;
      }

      // Extract reviews (with retry)
      const reviews = await this.retryWithBackoff(
        () => this.extractReviews(reviewFrame, limit),
        undefined,
        'extractReviews'
      );

      // Rate limiting
      await this.sleep(this.delay);

      console.log(`[NaverScrapingService] Scraped ${reviews.length} reviews`);
      return { reviews, counts };
    } catch (error: any) {
      console.error('[NaverScrapingService] Review scraping error:', error);

      if (error instanceof ScrapingSelectorNotFoundError) {
        return { reviews: [], counts: { visitorReviewCount: null, blogReviewCount: null } }; // "No reviews" case - graceful degradation
      }

      if (error instanceof ScrapingTimeoutError || error instanceof ScrapingNetworkError) {
        throw error; // Transient errors - should be retried by caller
      }

      if (error.name === 'TimeoutError') {
        throw new ScrapingTimeoutError(`Review scraping timed out after ${this.timeout}ms`);
      }

      throw new InternalServerError(`Unexpected scraping error: ${error.message}`);
    } finally {
      await page.close();
      await browser.close();
      console.log('[NaverScrapingService] Browser closed');
    }
  }

  /**
   * Wait for review section to load
   */
  private async waitForReviewSection(frame: Frame): Promise<void> {
    // Try multiple selectors for review section
    const selectors = [
      '.place_section_review',    // From investigate-naver-review.ts
      '.review_item',
      '.review_li',                // From investigate-naver-review.ts
      '.place_review_list',
      '[data-review-id]',
      '.ReviewItem',
      '[class*="review"][class*="item"]'  // Flexible pattern matching
    ];

    for (const selector of selectors) {
      try {
        await frame.waitForSelector(selector, { timeout: this.timeout });
        console.log(`[NaverScrapingService] Review section found with selector: ${selector}`);
        return;
      } catch (error: any) {
        if (error.name === 'TimeoutError') {
          continue; // Try next selector
        } else {
          console.error(`[NaverScrapingService] Error waiting for selector ${selector}:`, error);
          throw new ScrapingNetworkError(`Network error while waiting for reviews: ${error.message}`);
        }
      }
    }

    throw new ScrapingSelectorNotFoundError(
      `Review section not found. Tried selectors: ${selectors.join(', ')}`
    );
  }

  /**
   * Extract reviews from frame
   */
  private async extractReviews(
    frame: Frame,
    limit: number
  ): Promise<NaverReviewResult[]> {
    const reviews: NaverReviewResult[] = [];

    try {
      // Try multiple selectors for review items
      const itemSelectors = [
        '.place_section_review',
        '.review_item',
        '.review_li',
        '.ReviewItem',
        '[data-review-id]',
        '[class*="review"][class*="item"]'
      ];
      let reviewItems: any[] = [];

      for (const selector of itemSelectors) {
        reviewItems = await frame.$$(selector);
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
   * Retry operation with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = parseInt(process.env.PUPPETEER_RETRY_COUNT || '2', 10),
    operationName: string = 'operation'
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const isLastAttempt = attempt === retries;

        // Don't retry permanent failures
        if (error instanceof ScrapingSelectorNotFoundError) {
          throw error;
        }

        if (isLastAttempt) {
          console.error(
            `[NaverScrapingService] ${operationName} failed after ${retries + 1} attempts`
          );
          throw error;
        }

        const backoffMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s...
        console.warn(
          `[NaverScrapingService] ${operationName} failed (attempt ${attempt + 1}/${retries + 1}), ` +
          `retrying in ${backoffMs}ms...`,
          error.message
        );
        await this.sleep(backoffMs);
      }
    }

    throw new Error('Retry logic error'); // Should never reach here
  }

  /**
   * Close browser and cleanup resources
   * Note: With per-request browser lifecycle, browsers are closed after each request.
   * This method is kept for interface compatibility but does nothing.
   */
  async close(): Promise<void> {
    // No-op: browsers are now created and closed per-request
    console.log('[NaverScrapingService] close() called - no persistent browser to close');
  }
}
