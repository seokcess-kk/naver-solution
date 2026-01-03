import { Exclude, Expose } from 'class-transformer';
import { NotificationSetting } from '@domain/entities/NotificationSetting';

@Exclude()
export class NotificationSettingResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  placeId: string | null;

  @Expose()
  placeName?: string;

  @Expose()
  notificationType: string;

  @Expose()
  channel: string;

  @Expose()
  isEnabled: boolean;

  @Expose()
  conditions: Record<string, any> | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static fromEntity(setting: NotificationSetting): NotificationSettingResponseDto {
    const dto = new NotificationSettingResponseDto();
    dto.id = setting.id;
    dto.userId = setting.user.id;
    dto.placeId = setting.place?.id || null;
    dto.placeName = setting.place?.name;
    dto.notificationType = setting.notificationType;
    dto.channel = setting.channel;
    dto.isEnabled = setting.isEnabled;
    dto.conditions = setting.conditions;
    dto.createdAt = setting.createdAt;
    dto.updatedAt = setting.updatedAt;

    return dto;
  }
}
