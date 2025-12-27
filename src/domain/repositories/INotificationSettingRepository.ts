import { NotificationSetting } from '../entities/NotificationSetting';

export interface INotificationSettingRepository {
  findById(id: string): Promise<NotificationSetting | null>;
  findAll(): Promise<NotificationSetting[]>;
  save(setting: NotificationSetting): Promise<NotificationSetting>;
  update(id: string, data: Partial<NotificationSetting>): Promise<NotificationSetting>;
  delete(id: string): Promise<void>;

  findByUserId(userId: string): Promise<NotificationSetting[]>;
  findByPlaceId(placeId: string): Promise<NotificationSetting[]>;
  findEnabledByUserId(userId: string): Promise<NotificationSetting[]>;
  findByTypeAndChannel(
    userId: string,
    type: string,
    channel: string
  ): Promise<NotificationSetting[]>;
  updateEnabledStatus(id: string, isEnabled: boolean): Promise<void>;
}
