import apiClient from './client';
import {
  ApiResponse,
  Review,
  GetReviewsParams,
  RecordReviewInput,
  ScrapeReviewsInput,
  ScrapeReviewsResponse,
  ReviewSentiment,
  ReviewHistory,
  ReviewStats,
  GetReviewHistoryParams,
} from '@/types/api';

/**
 * Place의 모든 리뷰 조회
 * @param placeId - Place ID
 * @param params - 필터링 파라미터 (sentiment, reviewType, limit, publishedAfter)
 */
export async function getPlaceReviews(
  placeId: string,
  params?: GetReviewsParams
): Promise<Review[]> {
  const { data } = await apiClient.get<ApiResponse<Review[]>>(
    `/reviews/place/${placeId}`,
    { params }
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || '리뷰 목록을 불러오는데 실패했습니다');
  }

  return data.data;
}

/**
 * 감정별 리뷰 조회
 * @param placeId - Place ID
 * @param sentiment - 감정 타입 (POSITIVE, NEGATIVE, NEUTRAL)
 */
export async function getReviewsBySentiment(
  placeId: string,
  sentiment: ReviewSentiment
): Promise<Review[]> {
  const { data } = await apiClient.get<ApiResponse<Review[]>>(
    `/reviews/place/${placeId}/sentiment/${sentiment}`
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || '감정별 리뷰를 불러오는데 실패했습니다');
  }

  return data.data;
}

/**
 * 리뷰 기록
 * @param input - 리뷰 기록 정보
 */
export async function recordReview(input: RecordReviewInput): Promise<Review> {
  const { data } = await apiClient.post<ApiResponse<Review>>('/reviews', input);

  if (!data.success || !data.data) {
    throw new Error(data.message || '리뷰 기록에 실패했습니다');
  }

  return data.data;
}

/**
 * 네이버 리뷰 스크래핑
 * @param input - 스크래핑 요청 정보
 */
export async function scrapeReviews(
  input: ScrapeReviewsInput
): Promise<ScrapeReviewsResponse> {
  const { data } = await apiClient.post<ApiResponse<ScrapeReviewsResponse>>(
    '/reviews/scrape',
    input
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || '리뷰 스크래핑에 실패했습니다');
  }

  return data.data;
}

/**
 * 리뷰 히스토리 조회
 * @param placeId - Place ID
 * @param params - 필터링 파라미터 (startDate, endDate, limit)
 */
export async function getReviewHistory(
  placeId: string,
  params?: GetReviewHistoryParams
): Promise<ReviewHistory[]> {
  const { data } = await apiClient.get<ApiResponse<ReviewHistory[]>>(
    `/review-history/place/${placeId}`,
    { params }
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || '리뷰 히스토리를 불러오는데 실패했습니다');
  }

  return data.data;
}

/**
 * 최신 리뷰 통계 조회
 * @param placeId - Place ID
 */
export async function getLatestReviewStats(
  placeId: string
): Promise<ReviewStats | null> {
  const { data } = await apiClient.get<ApiResponse<ReviewStats>>(
    `/review-history/place/${placeId}/latest`
  );

  if (!data.success) {
    throw new Error(data.message || '최신 리뷰 통계를 불러오는데 실패했습니다');
  }

  return data.data || null;
}
