import { DataSource, Repository, Between } from 'typeorm';
import { IRankingHistoryRepository } from '@domain/repositories/IRankingHistoryRepository';
import { RankingHistory } from '@domain/entities/RankingHistory';

export class RankingHistoryRepository implements IRankingHistoryRepository {
  private readonly repository: Repository<RankingHistory>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RankingHistory);
  }

  async findById(id: string): Promise<RankingHistory | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<RankingHistory[]> {
    return this.repository.find();
  }

  async save(rankingHistory: RankingHistory): Promise<RankingHistory> {
    return this.repository.save(rankingHistory);
  }

  async update(id: string, data: Partial<RankingHistory>): Promise<RankingHistory> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`RankingHistory with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByPlaceKeywordId(placeKeywordId: string, limit?: number): Promise<RankingHistory[]> {
    return this.repository.find({
      where: { placeKeyword: { id: placeKeywordId } },
      relations: ['placeKeyword'],
      order: { checkedAt: 'DESC' },
      take: limit,
    });
  }

  async findByPlaceKeywordIdInDateRange(
    placeKeywordId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RankingHistory[]> {
    return this.repository.find({
      where: {
        placeKeyword: { id: placeKeywordId },
        checkedAt: Between(startDate, endDate),
      },
      relations: ['placeKeyword'],
      order: { checkedAt: 'DESC' },
    });
  }

  async findLatestByPlaceKeywordId(placeKeywordId: string): Promise<RankingHistory | null> {
    return this.repository.findOne({
      where: { placeKeyword: { id: placeKeywordId } },
      relations: ['placeKeyword'],
      order: { checkedAt: 'DESC' },
    });
  }
}
