import { NotificationLog } from '../entities/NotificationLog';

export interface INotificationLogRepository {
  findById(id: string): Promise<NotificationLog | null>;
  findAll(): Promise<NotificationLog[]>;
  save(log: NotificationLog): Promise<NotificationLog>;
  update(id: string, data: Partial<NotificationLog>): Promise<NotificationLog>;
  delete(id: string): Promise<void>;

  findByPlaceId(placeId: string, limit?: number): Promise<NotificationLog[]>;
  findByNotificationSettingId(settingId: string): Promise<NotificationLog[]>;
  findUnsentLogs(): Promise<NotificationLog[]>;
  findFailedLogs(hours: number): Promise<NotificationLog[]>;
  markAsSent(id: string, sentAt: Date): Promise<void>;
  markAsFailed(id: string, errorMessage: string): Promise<void>;
}
