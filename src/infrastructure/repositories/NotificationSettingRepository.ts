import { DataSource, Repository } from 'typeorm';
import { INotificationSettingRepository } from '@domain/repositories/INotificationSettingRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { NotificationSetting } from '@domain/entities/NotificationSetting';
import { NotFoundError } from '@application/errors/HttpError';

export class NotificationSettingRepository implements INotificationSettingRepository {
  private readonly repository: Repository<NotificationSetting>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(NotificationSetting);
  }

  async findById(id: string): Promise<NotificationSetting | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<NotificationSetting>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['user', 'place'],
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

  async save(setting: NotificationSetting): Promise<NotificationSetting> {
    return this.repository.save(setting);
  }

  async update(id: string, data: Partial<NotificationSetting>): Promise<NotificationSetting> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`NotificationSetting with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`NotificationSetting with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
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
