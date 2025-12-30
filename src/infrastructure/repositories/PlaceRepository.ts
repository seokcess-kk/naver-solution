import { DataSource, Repository } from 'typeorm';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { Place } from '@domain/entities/Place';
import { NotFoundError } from '@application/errors/HttpError';

export class PlaceRepository implements IPlaceRepository {
  private readonly repository: Repository<Place>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Place);
  }

  async findById(id: string): Promise<Place | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<Place>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['user'],
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

  async save(place: Place): Promise<Place> {
    return this.repository.save(place);
  }

  async update(id: string, data: Partial<Place>): Promise<Place> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`Place with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`Place with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async findByUserId(userId: string, options: PaginationOptions = {}): Promise<PaginatedResult<Place>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      where: { user: { id: userId } },
      relations: ['user'],
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
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

  async findByNaverPlaceId(naverPlaceId: string): Promise<Place | null> {
    return this.repository.findOne({ where: { naverPlaceId } });
  }

  async findActiveByUserId(userId: string): Promise<Place[]> {
    return this.repository.find({
      where: { user: { id: userId }, isActive: true },
      relations: ['user'],
    });
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    await this.repository.update(id, { isActive });
  }
}
