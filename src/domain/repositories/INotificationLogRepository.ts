import { NotificationLog } from '../entities/NotificationLog';
import { IBaseRepository } from './IBaseRepository';

/**
 * NotificationLog Repository Interface
 * Extends IBaseRepository with NotificationLog-specific query methods
 */
export interface INotificationLogRepository extends IBaseRepository<NotificationLog> {
  /**
   * Find notification logs for a specific place
   * @param placeId - The place ID
   * @param limit - Optional limit for results
   * @returns Array of notification logs
   */
  findByPlaceId(placeId: string, limit?: number): Promise<NotificationLog[]>;

  /**
   * Find notification logs for a specific notification setting
   * @param settingId - The notification setting ID
   * @returns Array of notification logs
   */
  findByNotificationSettingId(settingId: string): Promise<NotificationLog[]>;

  /**
   * Find all unsent notification logs
   * @returns Array of unsent notification logs
   */
  findUnsentLogs(): Promise<NotificationLog[]>;

  /**
   * Find failed notification logs within specified hours
   * @param hours - Number of hours to look back
   * @returns Array of failed notification logs
   */
  findFailedLogs(hours: number): Promise<NotificationLog[]>;

  /**
   * Mark a notification log as sent
   * @param id - The notification log ID
   * @param sentAt - The timestamp when sent
   */
  markAsSent(id: string, sentAt: Date): Promise<void>;

  /**
   * Mark a notification log as failed
   * @param id - The notification log ID
   * @param errorMessage - The error message
   */
  markAsFailed(id: string, errorMessage: string): Promise<void>;
}
