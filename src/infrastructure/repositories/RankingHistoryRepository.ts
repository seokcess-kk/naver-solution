import { DataSource, Repository, Between } from 'typeorm';
import { IRankingHistoryRepository } from '@domain/repositories/IRankingHistoryRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { RankingHistory } from '@domain/entities/RankingHistory';
import { NotFoundError } from '@application/errors/HttpError';

export class RankingHistoryRepository implements IRankingHistoryRepository {
  private readonly repository: Repository<RankingHistory>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RankingHistory);
  }

  async findById(id: string): Promise<RankingHistory | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<RankingHistory>> {
    const { page = 1, limit = 10, sortBy = 'checkedAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['placeKeyword'],
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

  async save(rankingHistory: RankingHistory): Promise<RankingHistory> {
    return this.repository.save(rankingHistory);
  }

  async update(id: string, data: Partial<RankingHistory>): Promise<RankingHistory> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`RankingHistory with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`RankingHistory with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
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
