import { DataSource, Repository, Between } from 'typeorm';
import { IReviewHistoryRepository } from '@domain/repositories/IReviewHistoryRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { ReviewHistory } from '@domain/entities/ReviewHistory';
import { NotFoundError } from '@application/errors/HttpError';

export class ReviewHistoryRepository implements IReviewHistoryRepository {
  private readonly repository: Repository<ReviewHistory>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(ReviewHistory);
  }

  async findById(id: string): Promise<ReviewHistory | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<ReviewHistory>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['place'],
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

  async save(reviewHistory: ReviewHistory): Promise<ReviewHistory> {
    return this.repository.save(reviewHistory);
  }

  async update(id: string, data: Partial<ReviewHistory>): Promise<ReviewHistory> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`ReviewHistory with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`ReviewHistory with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async findByPlaceId(placeId: string, limit?: number): Promise<ReviewHistory[]> {
    return this.repository.find({
      where: { place: { id: placeId } },
      relations: ['place'],
      order: { checkedAt: 'DESC' },
      take: limit,
    });
  }

  async findByPlaceIdInDateRange(
    placeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReviewHistory[]> {
    return this.repository.find({
      where: {
        place: { id: placeId },
        checkedAt: Between(startDate, endDate),
      },
      relations: ['place'],
      order: { checkedAt: 'DESC' },
    });
  }

  async findLatestByPlaceId(placeId: string): Promise<ReviewHistory | null> {
    return this.repository.findOne({
      where: { place: { id: placeId } },
      relations: ['place'],
      order: { checkedAt: 'DESC' },
    });
  }
}
