import { INotificationSettingRepository } from '@domain/repositories/INotificationSettingRepository';

export class DeleteNotificationSettingUseCase {
  constructor(
    private readonly notificationSettingRepository: INotificationSettingRepository
  ) {}

  async execute(id: string): Promise<void> {
    await this.notificationSettingRepository.delete(id);
  }
}
