import { DataSource, Repository, MoreThanOrEqual } from 'typeorm';
import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { Review } from '@domain/entities/Review';
import { NotFoundError } from '@application/errors/HttpError';

export class ReviewRepository implements IReviewRepository {
  private readonly repository: Repository<Review>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Review);
  }

  async findById(id: string): Promise<Review | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<Review>> {
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

  async save(review: Review): Promise<Review> {
    return this.repository.save(review);
  }

  async update(id: string, data: Partial<Review>): Promise<Review> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`Review with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`Review with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async findByPlaceId(placeId: string, limit?: number): Promise<Review[]> {
    return this.repository.find({
      where: { place: { id: placeId } },
      relations: ['place'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async findByNaverReviewId(naverReviewId: string): Promise<Review | null> {
    return this.repository.findOne({ where: { naverReviewId } });
  }

  async findBySentiment(placeId: string, sentiment: string): Promise<Review[]> {
    return this.repository.find({
      where: {
        place: { id: placeId },
        sentiment,
      },
      relations: ['place'],
      order: { publishedAt: 'DESC' },
    });
  }

  async findRecentByPlaceId(placeId: string, days: number): Promise<Review[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.repository.find({
      where: {
        place: { id: placeId },
        publishedAt: MoreThanOrEqual(cutoffDate),
      },
      relations: ['place'],
      order: { publishedAt: 'DESC' },
    });
  }
}
