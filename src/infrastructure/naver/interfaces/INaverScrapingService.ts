/**
 * Result interface for Naver ranking scraping
 */
export interface NaverRankingResult {
  rank: number | null; // Position in search results (1-based), null if not found
  searchResultCount: number | null; // Total number of search results
  found: boolean; // Whether the place was found in results
}

/**
 * Result interface for Naver review scraping
 */
export interface NaverReviewResult {
  naverReviewId: string; // 리뷰 고유 ID (중복 체크용)
  reviewType: 'BLOG' | 'VISITOR' | 'OTHER'; // 리뷰 타입
  content: string | null; // 리뷰 내용
  rating: number | null; // 별점 (1-5)
  author: string | null; // 작성자명
  publishedAt: Date | null; // 작성일시
}

/**
 * Interface for Naver Place scraping operations
 */
export interface INaverScrapingService {
  /**
   * Scrape ranking position for a place from Naver search results
   * @param keyword - Search keyword
   * @param region - Optional region filter (will be appended to keyword)
   * @param targetPlaceId - Naver Place ID to find in results
   * @returns Ranking result with position and metadata
   */
  scrapeRanking(
    keyword: string,
    region: string | null,
    targetPlaceId: string
  ): Promise<NaverRankingResult>;

  /**
   * Scrape reviews from Naver Place page
   * @param naverPlaceId - Naver Place ID
   * @param limit - Maximum number of reviews to scrape (default: 10)
   * @returns Array of scraped review data
   */
  scrapeReviews(
    naverPlaceId: string,
    limit?: number
  ): Promise<NaverReviewResult[]>;

  /**
   * Close browser instance and cleanup resources
   */
  close(): Promise<void>;
}
