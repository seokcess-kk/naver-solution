import axios from 'axios';
import {
  INaverScrapingService,
  NaverRankingResult,
  NaverReviewResult,
} from './interfaces/INaverScrapingService';

export class FirecrawlNaverScrapingService implements INaverScrapingService {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY || '';
    this.apiUrl = process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev/v1';

    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required for FirecrawlNaverScrapingService');
    }
  }

  /**
   * Scrape ranking using Firecrawl API with LLM-based extraction
   */
  async scrapeRanking(
    keyword: string,
    region: string | null,
    targetPlaceId: string
  ): Promise<NaverRankingResult> {
    const searchQuery = region ? `${keyword} ${region}` : keyword;
    const searchUrl = `https://search.naver.com/search.naver?where=place&query=${encodeURIComponent(searchQuery)}`;

    console.log(`[FirecrawlNaverScrapingService] Scraping: ${searchUrl}`);

    try {
      const response = await axios.post(
        `${this.apiUrl}/scrape`,
        {
          url: searchUrl,
          formats: ['extract'],
          extract: {
            schema: {
              type: 'object',
              properties: {
                places: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      rank: { type: 'number', description: '검색 결과에서의 순위 (1부터 시작)' },
                      name: { type: 'string', description: '플레이스 이름' },
                      place_id: { type: 'string', description: '네이버 플레이스 ID (URL에서 추출)' },
                    },
                  },
                },
                total_results: { type: 'number', description: '전체 검색 결과 수' },
              },
            },
            prompt: `네이버 플레이스 검색 결과에서 상위 20개 장소 정보를 순서대로 추출해주세요.
각 장소의 순위(1부터 시작), 이름, 플레이스 ID를 추출합니다.
플레이스 ID는 URL에서 /place/ 뒤에 오는 숫자입니다.
total_results는 페이지에 표시된 전체 검색 결과 개수입니다.`,
          },
          waitFor: 3000, // Wait for dynamic content to load
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('[FirecrawlNaverScrapingService] API Response received');

      const places = response.data?.data?.extract?.places || [];
      const totalResults = response.data?.data?.extract?.total_results || null;

      console.log(`[FirecrawlNaverScrapingService] Extracted ${places.length} places`);

      // Find target place by ID or name
      const targetPlace = places.find(
        (p: any) => p.place_id === targetPlaceId || p.name?.includes(targetPlaceId)
      );

      if (targetPlace) {
        console.log(
          `[FirecrawlNaverScrapingService] Found target place at rank ${targetPlace.rank}`
        );
      } else {
        console.warn(
          `[FirecrawlNaverScrapingService] Target place ${targetPlaceId} not found in ${places.length} results`
        );
      }

      return {
        rank: targetPlace?.rank || null,
        searchResultCount: totalResults,
        found: !!targetPlace,
      };
    } catch (error: any) {
      console.error('[FirecrawlNaverScrapingService] Scraping error:', error.message);

      if (error.response) {
        console.error(
          `[FirecrawlNaverScrapingService] API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        );
      }

      return {
        rank: null,
        searchResultCount: null,
        found: false,
      };
    }
  }

  /**
   * Scrape reviews - Phase 3 implementation
   * Currently returns empty array, reviews will use Puppeteer fallback
   */
  async scrapeReviews(naverPlaceId: string, limit: number = 10): Promise<NaverReviewResult[]> {
    console.log(
      `[FirecrawlNaverScrapingService] Review scraping not yet implemented (Phase 3)`
    );
    return [];
  }

  /**
   * No cleanup needed for HTTP client
   */
  async close(): Promise<void> {
    console.log('[FirecrawlNaverScrapingService] Service closed');
  }
}
