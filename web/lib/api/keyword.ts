import apiClient from './client';
import {
  ApiResponse,
  Keyword,
  PlaceKeyword,
  AddPlaceKeywordInput,
} from '@/types/api';

/**
 * Keyword 목록 조회
 */
export async function getKeywords(): Promise<Keyword[]> {
  const { data } = await apiClient.get<ApiResponse<Keyword[]>>('/keywords');

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch keywords');
  }

  return data.data;
}

/**
 * Place의 Keyword 목록 조회
 */
export async function getPlaceKeywords(placeId: string): Promise<PlaceKeyword[]> {
  const { data } = await apiClient.get<ApiResponse<PlaceKeyword[]>>(
    `/keywords/place/${placeId}`
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch place keywords');
  }

  return data.data;
}

/**
 * Place에 Keyword 추가
 */
export async function addPlaceKeyword(input: AddPlaceKeywordInput): Promise<PlaceKeyword> {
  const { data } = await apiClient.post<ApiResponse<PlaceKeyword>>(
    '/keywords/place',
    input
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to add keyword to place');
  }

  return data.data;
}

/**
 * Place에서 Keyword 제거
 */
export async function removePlaceKeyword(placeKeywordId: string): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<void>>(
    `/keywords/place/${placeKeywordId}`
  );

  if (!data.success) {
    throw new Error(data.message || 'Failed to remove keyword from place');
  }
}
