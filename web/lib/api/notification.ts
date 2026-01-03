import apiClient from './client';
import {
  ApiResponse,
  NotificationSetting,
  CreateNotificationSettingInput,
  UpdateNotificationSettingInput,
  NotificationLog,
} from '@/types/api';

/**
 * 사용자의 알림 설정 목록 조회
 */
export async function getUserNotificationSettings(
  userId: string
): Promise<NotificationSetting[]> {
  const { data } = await apiClient.get<ApiResponse<NotificationSetting[]>>(
    `/notifications/settings/user/${userId}`
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch notification settings');
  }

  return data.data;
}

/**
 * 알림 설정 생성
 */
export async function createNotificationSetting(
  input: CreateNotificationSettingInput
): Promise<NotificationSetting> {
  const { data } = await apiClient.post<ApiResponse<NotificationSetting>>(
    '/notifications/settings',
    input
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to create notification setting');
  }

  return data.data;
}

/**
 * 알림 설정 수정
 */
export async function updateNotificationSetting(
  id: string,
  input: UpdateNotificationSettingInput
): Promise<NotificationSetting> {
  const { data } = await apiClient.patch<ApiResponse<NotificationSetting>>(
    `/notifications/settings/${id}`,
    input
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to update notification setting');
  }

  return data.data;
}

/**
 * 알림 설정 삭제
 */
export async function deleteNotificationSetting(id: string): Promise<void> {
  await apiClient.delete(`/notifications/settings/${id}`);
}

/**
 * Place의 알림 로그 조회
 */
export async function getPlaceNotificationLogs(
  placeId: string,
  limit?: number
): Promise<NotificationLog[]> {
  const { data } = await apiClient.get<ApiResponse<NotificationLog[]>>(
    `/notifications/logs/place/${placeId}`,
    { params: { limit } }
  );

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch notification logs');
  }

  return data.data;
}
