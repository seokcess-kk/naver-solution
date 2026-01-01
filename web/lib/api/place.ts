import apiClient from './client';
import {
  ApiResponse,
  PaginatedResponse,
  Place,
  CreatePlaceInput,
  UpdatePlaceInput,
  PlaceStats,
} from '@/types/api';

export interface GetPlacesParams {
  userId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Place 목록 조회 (페이지네이션)
 */
export async function getPlaces(params: GetPlacesParams): Promise<PaginatedResponse<Place>> {
  const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Place>>>('/places', {
    params,
  });

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch places');
  }

  return data.data;
}

/**
 * Place 상세 조회
 */
export async function getPlace(id: string): Promise<Place> {
  const { data } = await apiClient.get<ApiResponse<Place>>(`/places/${id}`);

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch place');
  }

  return data.data;
}

/**
 * Place 생성
 */
export async function createPlace(input: CreatePlaceInput): Promise<Place> {
  const { data } = await apiClient.post<ApiResponse<Place>>('/places', input);

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to create place');
  }

  return data.data;
}

/**
 * Place 수정
 */
export async function updatePlace(id: string, input: UpdatePlaceInput): Promise<Place> {
  const { data } = await apiClient.put<ApiResponse<Place>>(`/places/${id}`, input);

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to update place');
  }

  return data.data;
}

/**
 * Place 활성 상태 변경
 */
export async function updatePlaceStatus(id: string, isActive: boolean): Promise<Place> {
  const { data } = await apiClient.patch<ApiResponse<Place>>(`/places/${id}/status`, {
    isActive,
  });

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to update place status');
  }

  return data.data;
}

/**
 * Place 삭제 (soft delete)
 */
export async function deletePlace(id: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/places/${id}`);

  if (!data.success) {
    throw new Error(data.message || 'Failed to delete place');
  }
}

/**
 * Place 통계 조회
 */
export async function getPlaceStats(userId: string): Promise<PlaceStats> {
  const { data } = await apiClient.get<ApiResponse<PlaceStats>>('/places/stats', {
    params: { userId },
  });

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch place stats');
  }

  return data.data;
}
