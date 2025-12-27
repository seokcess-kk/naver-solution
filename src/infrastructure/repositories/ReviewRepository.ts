import { DataSource, Repository, MoreThanOrEqual } from 'typeorm';
import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { Review } from '@domain/entities/Review';

export class ReviewRepository implements IReviewRepository {
  private readonly repository: Repository<Review>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Review);
  }

  async findById(id: string): Promise<Review | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<Review[]> {
    return this.repository.find();
  }

  async save(review: Review): Promise<Review> {
    return this.repository.save(review);
  }

  async update(id: string, data: Partial<Review>): Promise<Review> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Review with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
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
