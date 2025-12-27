import { DataSource, Repository, LessThan } from 'typeorm';
import { INotificationLogRepository } from '@domain/repositories/INotificationLogRepository';
import { NotificationLog } from '@domain/entities/NotificationLog';

export class NotificationLogRepository implements INotificationLogRepository {
  private readonly repository: Repository<NotificationLog>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(NotificationLog);
  }

  async findById(id: string): Promise<NotificationLog | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<NotificationLog[]> {
    return this.repository.find();
  }

  async save(log: NotificationLog): Promise<NotificationLog> {
    return this.repository.save(log);
  }

  async update(id: string, data: Partial<NotificationLog>): Promise<NotificationLog> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`NotificationLog with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByPlaceId(placeId: string, limit?: number): Promise<NotificationLog[]> {
    return this.repository.find({
      where: { place: { id: placeId } },
      relations: ['place', 'notificationSetting'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByNotificationSettingId(settingId: string): Promise<NotificationLog[]> {
    return this.repository.find({
      where: { notificationSetting: { id: settingId } },
      relations: ['place', 'notificationSetting'],
      order: { createdAt: 'DESC' },
    });
  }

  async findUnsentLogs(): Promise<NotificationLog[]> {
    return this.repository.find({
      where: { isSent: false },
      relations: ['place', 'notificationSetting'],
      order: { createdAt: 'ASC' },
    });
  }

  async findFailedLogs(hours: number): Promise<NotificationLog[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return this.repository.find({
      where: {
        isSent: false,
        createdAt: LessThan(cutoffDate),
      },
      relations: ['place', 'notificationSetting'],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsSent(id: string, sentAt: Date): Promise<void> {
    await this.repository.update(id, { isSent: true, sentAt });
  }

  async markAsFailed(id: string, errorMessage: string): Promise<void> {
    await this.repository.update(id, { isSent: false, errorMessage });
  }
}
