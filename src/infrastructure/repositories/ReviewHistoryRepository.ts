import { DataSource, Repository, Between } from 'typeorm';
import { IReviewHistoryRepository } from '@domain/repositories/IReviewHistoryRepository';
import { ReviewHistory } from '@domain/entities/ReviewHistory';

export class ReviewHistoryRepository implements IReviewHistoryRepository {
  private readonly repository: Repository<ReviewHistory>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(ReviewHistory);
  }

  async findById(id: string): Promise<ReviewHistory | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<ReviewHistory[]> {
    return this.repository.find();
  }

  async save(reviewHistory: ReviewHistory): Promise<ReviewHistory> {
    return this.repository.save(reviewHistory);
  }

  async update(id: string, data: Partial<ReviewHistory>): Promise<ReviewHistory> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`ReviewHistory with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
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
