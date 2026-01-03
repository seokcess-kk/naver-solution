import { Exclude, Expose } from 'class-transformer';
import { NotificationLog } from '@domain/entities/NotificationLog';

@Exclude()
export class NotificationLogResponseDto {
  @Expose()
  id: string;

  @Expose()
  notificationSettingId: string;

  @Expose()
  placeId: string;

  @Expose()
  placeName?: string;

  @Expose()
  notificationType: string;

  @Expose()
  channel: string;

  @Expose()
  message: string;

  @Expose()
  isSent: boolean;

  @Expose()
  sentAt: Date | null;

  @Expose()
  errorMessage: string | null;

  @Expose()
  createdAt: Date;

  static fromEntity(log: NotificationLog): NotificationLogResponseDto {
    const dto = new NotificationLogResponseDto();
    dto.id = log.id;
    dto.notificationSettingId = log.notificationSetting.id;
    dto.placeId = log.place.id;
    dto.placeName = log.place?.name;
    dto.notificationType = log.notificationType;
    dto.channel = log.channel;
    dto.message = log.message;
    dto.isSent = log.isSent;
    dto.sentAt = log.sentAt;
    dto.errorMessage = log.errorMessage;
    dto.createdAt = log.createdAt;

    return dto;
  }
}
