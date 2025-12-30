/**
 * DTO for Naver review scraping response
 */
export class ScrapeReviewsResponseDto {
  placeId: string;
  scrapedCount: number; // 스크래핑 시도한 리뷰 개수
  savedCount: number; // DB 저장 성공한 개수
  duplicateCount: number; // 중복으로 skip한 개수
  failedCount: number; // 저장 실패한 개수
  executionTimeMs: number; // 스크래핑 소요 시간 (ms)
  scrapedAt: Date; // 스크래핑 실행 시각
}
