/**
 * DTO for Naver ranking scraping response
 */
export class ScrapeRankingResponseDto {
  placeKeywordId: string;
  rank: number | null;
  searchResultCount: number | null;
  found: boolean;
  checkedAt: Date;
  rankingHistoryId: string;
}
