import { INotificationSettingRepository } from '@domain/repositories/INotificationSettingRepository';
import { NotificationSettingResponseDto } from '@application/dtos/notification';

export class GetUserNotificationSettingsUseCase {
  constructor(
    private readonly notificationSettingRepository: INotificationSettingRepository
  ) {}

  async execute(userId: string): Promise<NotificationSettingResponseDto[]> {
    const settings = await this.notificationSettingRepository.findByUserId(userId);
    return settings.map((setting) =>
      NotificationSettingResponseDto.fromEntity(setting)
    );
  }
}
