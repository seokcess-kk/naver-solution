import { DataSource, Repository, Between } from 'typeorm';
import { ICompetitorSnapshotRepository } from '@domain/repositories/ICompetitorSnapshotRepository';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';

export class CompetitorSnapshotRepository implements ICompetitorSnapshotRepository {
  private readonly repository: Repository<CompetitorSnapshot>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(CompetitorSnapshot);
  }

  async findById(id: string): Promise<CompetitorSnapshot | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<CompetitorSnapshot[]> {
    return this.repository.find();
  }

  async save(snapshot: CompetitorSnapshot): Promise<CompetitorSnapshot> {
    return this.repository.save(snapshot);
  }

  async update(id: string, data: Partial<CompetitorSnapshot>): Promise<CompetitorSnapshot> {
    await this.repository.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`CompetitorSnapshot with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
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
