import {
  INaverScrapingService,
  NaverRankingResult,
  NaverReviewResult,
} from './interfaces/INaverScrapingService';
import { FirecrawlNaverScrapingService } from './FirecrawlNaverScrapingService';
import { NaverScrapingService } from './NaverScrapingService';

/**
 * Hybrid scraping service that tries Firecrawl first and falls back to Puppeteer
 *
 * Benefits:
 * - Uses Firecrawl's LLM-based extraction for robustness against DOM changes
 * - Falls back to Puppeteer if Firecrawl fails or API key is not configured
 * - Cost optimization: Only uses Firecrawl when API key is provided
 * - Zero downtime: Always has a working fallback
 */
export class HybridNaverScrapingService implements INaverScrapingService {
  private firecrawlService: FirecrawlNaverScrapingService | null;
  private puppeteerService: NaverScrapingService;
  private firecrawlEnabled: boolean;

  constructor() {
    this.firecrawlEnabled = !!process.env.FIRECRAWL_API_KEY;

    if (this.firecrawlEnabled) {
      try {
        this.firecrawlService = new FirecrawlNaverScrapingService();
        console.log('[HybridNaverScrapingService] Firecrawl enabled');
      } catch (error) {
        console.warn(
          '[HybridNaverScrapingService] Failed to initialize Firecrawl, using Puppeteer only:',
          error
        );
        this.firecrawlService = null;
        this.firecrawlEnabled = false;
      }
    } else {
      console.log('[HybridNaverScrapingService] Firecrawl disabled (no API key), using Puppeteer only');
      this.firecrawlService = null;
    }

    this.puppeteerService = new NaverScrapingService();
  }

  /**
   * Scrape ranking with hybrid approach:
   * 1. Try Firecrawl (if enabled)
   * 2. Fallback to Puppeteer if Firecrawl fails or returns no results
   */
  async scrapeRanking(
    keyword: string,
    region: string | null,
    targetPlaceId: string
  ): Promise<NaverRankingResult> {
    // Try Firecrawl first if enabled
    if (this.firecrawlEnabled && this.firecrawlService) {
      try {
        console.log('[HybridNaverScrapingService] Attempting Firecrawl API...');
        const startTime = Date.now();

        const result = await this.firecrawlService.scrapeRanking(keyword, region, targetPlaceId);

        const duration = Date.now() - startTime;
        console.log(`[HybridNaverScrapingService] Firecrawl completed in ${duration}ms`);

        if (result.found) {
          console.log(
            `[HybridNaverScrapingService] Firecrawl success: rank=${result.rank}, searchResultCount=${result.searchResultCount}`
          );
          return result;
        }

        console.warn(
          '[HybridNaverScrapingService] Firecrawl returned no results, falling back to Puppeteer'
        );
      } catch (error) {
        console.error(
          '[HybridNaverScrapingService] Firecrawl failed, falling back to Puppeteer:',
          error
        );
      }
    }

    // Fallback to Puppeteer
    console.log('[HybridNaverScrapingService] Using Puppeteer fallback');
    const startTime = Date.now();

    const result = await this.puppeteerService.scrapeRanking(keyword, region, targetPlaceId);

    const duration = Date.now() - startTime;
    console.log(
      `[HybridNaverScrapingService] Puppeteer completed in ${duration}ms: rank=${result.rank}, found=${result.found}`
    );

    return result;
  }

  /**
   * Scrape reviews
   * Currently uses Puppeteer only (Phase 3 will add Firecrawl support)
   */
  async scrapeReviews(naverPlaceId: string, limit: number = 10): Promise<NaverReviewResult[]> {
    console.log('[HybridNaverScrapingService] Using Puppeteer for review scraping');
    return this.puppeteerService.scrapeReviews(naverPlaceId, limit);
  }

  /**
   * Close both services
   */
  async close(): Promise<void> {
    console.log('[HybridNaverScrapingService] Closing services');

    await Promise.all([
      this.firecrawlService ? this.firecrawlService.close() : Promise.resolve(),
      this.puppeteerService.close(),
    ]);

    console.log('[HybridNaverScrapingService] All services closed');
  }
}
