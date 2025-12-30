import { DataSource, Repository, LessThan } from 'typeorm';
import { INotificationLogRepository } from '@domain/repositories/INotificationLogRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { NotificationLog } from '@domain/entities/NotificationLog';
import { NotFoundError } from '@application/errors/HttpError';

export class NotificationLogRepository implements INotificationLogRepository {
  private readonly repository: Repository<NotificationLog>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(NotificationLog);
  }

  async findById(id: string): Promise<NotificationLog | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<NotificationLog>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['place', 'notificationSetting'],
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async save(log: NotificationLog): Promise<NotificationLog> {
    return this.repository.save(log);
  }

  async update(id: string, data: Partial<NotificationLog>): Promise<NotificationLog> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`NotificationLog with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`NotificationLog with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
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
