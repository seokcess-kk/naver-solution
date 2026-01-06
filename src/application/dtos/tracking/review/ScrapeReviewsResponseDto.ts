/**
 * DTO for Naver review scraping response
 */
export class ScrapeReviewsResponseDto {
  placeId: string;
  scrapedCount: number; // 스크래핑 시도한 리뷰 개수
  savedCount: number; // DB 저장 성공한 개수
  duplicateCount: number; // 중복으로 skip한 개수
  failedCount: number; // 저장 실패한 개수
  visitorReviewCount: number | null; // 추출된 방문자 리뷰 개수 (홈 탭에서)
  blogReviewCount: number | null; // 추출된 블로그 리뷰 개수 (홈 탭에서)
  countsExtracted: boolean; // 개수 추출 성공 여부
  executionTimeMs: number; // 스크래핑 소요 시간 (ms)
  scrapedAt: Date; // 스크래핑 실행 시각
}
