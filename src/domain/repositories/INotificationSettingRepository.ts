import { NotificationSetting } from '../entities/NotificationSetting';
import { IBaseRepository } from './IBaseRepository';

/**
 * NotificationSetting Repository Interface
 * Extends IBaseRepository with NotificationSetting-specific query methods
 */
export interface INotificationSettingRepository extends IBaseRepository<NotificationSetting> {
  /**
   * Find all notification settings for a user
   * @param userId - The user ID
   * @returns Array of notification settings
   */
  findByUserId(userId: string): Promise<NotificationSetting[]>;

  /**
   * Find all notification settings for a place
   * @param placeId - The place ID
   * @returns Array of notification settings
   */
  findByPlaceId(placeId: string): Promise<NotificationSetting[]>;

  /**
   * Find all enabled notification settings for a user
   * @param userId - The user ID
   * @returns Array of enabled notification settings
   */
  findEnabledByUserId(userId: string): Promise<NotificationSetting[]>;

  /**
   * Find notification settings by type and channel
   * @param userId - The user ID
   * @param type - The notification type
   * @param channel - The notification channel
   * @returns Array of matching notification settings
   */
  findByTypeAndChannel(
    userId: string,
    type: string,
    channel: string
  ): Promise<NotificationSetting[]>;

  /**
   * Update the enabled status of a notification setting
   * @param id - The notification setting ID
   * @param isEnabled - The new enabled status
   */
  updateEnabledStatus(id: string, isEnabled: boolean): Promise<void>;
}
