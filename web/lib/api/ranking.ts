import apiClient from './client';
import {
  ApiResponse,
  RankingHistory,
  RecordRankingInput,
  ScrapeRankingInput,
  ScrapeRankingResponse,
} from '@/types/api';

/**
 * 랭킹 히스토리 조회
 * @param placeKeywordId - PlaceKeyword ID
 * @param startDate - 시작 날짜 (선택사항)
 * @param endDate - 종료 날짜 (선택사항)
 */
export async function getRankingHistory(
  placeKeywordId: string,
  startDate?: string,
  endDate?: string
): Promise<RankingHistory[]> {
  const params: Record<string, string> = { placeKeywordId };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const { data } = await apiClient.get<ApiResponse<RankingHistory[]>>(
    '/rankings/history',
    { params }
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch ranking history');
  }

  return data.data;
}

/**
 * 최신 랭킹 조회
 * @param placeKeywordId - PlaceKeyword ID
 */
export async function getLatestRanking(
  placeKeywordId: string
): Promise<RankingHistory | null> {
  const { data } = await apiClient.get<ApiResponse<RankingHistory | null>>(
    `/rankings/latest/${placeKeywordId}`
  );

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch latest ranking');
  }

  return data.data || null;
}

/**
 * 랭킹 기록
 * @param input - 랭킹 기록 정보
 */
export async function recordRanking(
  input: RecordRankingInput
): Promise<RankingHistory> {
  const { data } = await apiClient.post<ApiResponse<RankingHistory>>(
    '/rankings',
    input
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to record ranking');
  }

  return data.data;
}

/**
 * 네이버 랭킹 스크래핑
 * @param input - 스크래핑 요청 정보
 */
export async function scrapeRanking(
  input: ScrapeRankingInput
): Promise<ScrapeRankingResponse> {
  const { data } = await apiClient.post<ApiResponse<ScrapeRankingResponse>>(
    '/rankings/scrape',
    input
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to scrape ranking');
  }

  return data.data;
}
