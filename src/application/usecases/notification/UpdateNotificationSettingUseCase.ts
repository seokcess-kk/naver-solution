import { INotificationSettingRepository } from '@domain/repositories/INotificationSettingRepository';
import { UpdateNotificationSettingDto, NotificationSettingResponseDto } from '@application/dtos/notification';

export class UpdateNotificationSettingUseCase {
  constructor(
    private readonly notificationSettingRepository: INotificationSettingRepository
  ) {}

  async execute(id: string, dto: UpdateNotificationSettingDto): Promise<NotificationSettingResponseDto> {
    const updated = await this.notificationSettingRepository.update(id, dto);
    return NotificationSettingResponseDto.fromEntity(updated);
  }
}
