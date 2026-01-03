import { INotificationLogRepository } from '@domain/repositories/INotificationLogRepository';
import { NotificationLogResponseDto } from '@application/dtos/notification';

export class GetNotificationLogsUseCase {
  constructor(
    private readonly notificationLogRepository: INotificationLogRepository
  ) {}

  async execute(placeId: string, limit?: number): Promise<NotificationLogResponseDto[]> {
    const logs = await this.notificationLogRepository.findByPlaceId(placeId, limit);
    return logs.map((log) => NotificationLogResponseDto.fromEntity(log));
  }
}
