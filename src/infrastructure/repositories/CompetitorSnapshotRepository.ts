import { DataSource, Repository, Between } from 'typeorm';
import { ICompetitorSnapshotRepository } from '@domain/repositories/ICompetitorSnapshotRepository';
import { PaginationOptions, PaginatedResult } from '@domain/repositories/IBaseRepository';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';
import { NotFoundError } from '@application/errors/HttpError';

export class CompetitorSnapshotRepository implements ICompetitorSnapshotRepository {
  private readonly repository: Repository<CompetitorSnapshot>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(CompetitorSnapshot);
  }

  async findById(id: string): Promise<CompetitorSnapshot | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<CompetitorSnapshot>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['competitor'],
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

  async save(snapshot: CompetitorSnapshot): Promise<CompetitorSnapshot> {
    return this.repository.save(snapshot);
  }

  async update(id: string, data: Partial<CompetitorSnapshot>): Promise<CompetitorSnapshot> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`CompetitorSnapshot with id ${id} not found`);
    }
    await this.repository.update(id, data);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) {
      throw new NotFoundError(`CompetitorSnapshot with id ${id} not found`);
    }
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.exist({ where: { id } });
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async findByCompetitorId(competitorId: string, limit?: number): Promise<CompetitorSnapshot[]> {
    return this.repository.find({
      where: { competitor: { id: competitorId } },
      relations: ['competitor'],
      order: { checkedAt: 'DESC' },
      take: limit,
    });
  }

  async findByCompetitorIdInDateRange(
    competitorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CompetitorSnapshot[]> {
    return this.repository.find({
      where: {
        competitor: { id: competitorId },
        checkedAt: Between(startDate, endDate),
      },
      relations: ['competitor'],
      order: { checkedAt: 'DESC' },
    });
  }

  async findLatestByCompetitorId(competitorId: string): Promise<CompetitorSnapshot | null> {
    return this.repository.findOne({
      where: { competitor: { id: competitorId } },
      relations: ['competitor'],
      order: { checkedAt: 'DESC' },
    });
  }
}
