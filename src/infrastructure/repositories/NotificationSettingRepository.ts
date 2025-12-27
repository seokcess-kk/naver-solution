import { DataSource, Repository } from 'typeorm';
import { INotificationSettingRepository } from '@domain/repositories/INotificationSettingRepository';
import { NotificationSetting } from '@domain/entities/NotificationSetting';

export class NotificationSettingRepository implements INotificationSettingRepository {
  private readonly repository: Repository<NotificationSetting>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(NotificationSetting);
  }

  async findById(id: string): Promise<NotificationSetting | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<NotificationSetting[]> {
    return this.repository.find();
  }

  async save(setting: NotificationSetting): Promise<NotificationSetting> {
    return this.repository.save(setting);
  }

  async update(id: string, data: Partial<NotificationSetting>): Promise<NotificationSetting> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`NotificationSetting with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByUserId(userId: string): Promise<NotificationSetting[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      relations: ['user', 'place'],
    });
  }

  async findByPlaceId(placeId: string): Promise<NotificationSetting[]> {
    return this.repository.find({
      where: { place: { id: placeId } },
      relations: ['user', 'place'],
    });
  }

  async findEnabledByUserId(userId: string): Promise<NotificationSetting[]> {
    return this.repository.find({
      where: { user: { id: userId }, isEnabled: true },
      relations: ['user', 'place'],
    });
  }

  async findByTypeAndChannel(
    userId: string,
    type: string,
    channel: string
  ): Promise<NotificationSetting[]> {
    return this.repository.find({
      where: {
        user: { id: userId },
        notificationType: type,
        channel,
      },
      relations: ['user', 'place'],
    });
  }

  async updateEnabledStatus(id: string, isEnabled: boolean): Promise<void> {
    await this.repository.update(id, { isEnabled });
  }
}
