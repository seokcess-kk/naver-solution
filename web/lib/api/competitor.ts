import apiClient from './client';
import {
  ApiResponse,
  Competitor,
  AddCompetitorInput,
  CompetitorSnapshot,
  RecordCompetitorSnapshotInput,
  GetCompetitorHistoryParams,
  CompetitorHistoryItem,
} from '@/types/api';

/**
 * Place의 경쟁사 목록 조회
 */
export async function getPlaceCompetitors(
  placeId: string,
  activeOnly?: boolean
): Promise<Competitor[]> {
  const { data} = await apiClient.get<ApiResponse<Competitor[]>>(
    `/competitors/place/${placeId}`,
    { params: { activeOnly } }
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch competitors');
  }

  return data.data;
}

/**
 * 경쟁사 추가
 */
export async function addCompetitor(input: AddCompetitorInput): Promise<Competitor> {
  const { data } = await apiClient.post<ApiResponse<Competitor>>(
    '/competitors',
    input
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to add competitor');
  }

  return data.data;
}

/**
 * 경쟁사 스냅샷 기록
 */
export async function recordCompetitorSnapshot(
  input: RecordCompetitorSnapshotInput
): Promise<CompetitorSnapshot> {
  const { data } = await apiClient.post<ApiResponse<CompetitorSnapshot>>(
    '/competitors/snapshots',
    input
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to record competitor snapshot');
  }

  return data.data;
}

/**
 * 경쟁사 히스토리 조회
 */
export async function getCompetitorHistory(
  competitorId: string,
  params?: GetCompetitorHistoryParams
): Promise<CompetitorHistoryItem[]> {
  const { data } = await apiClient.get<ApiResponse<CompetitorHistoryItem[]>>(
    `/competitors/${competitorId}/history`,
    { params }
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch competitor history');
  }

  return data.data;
}
