import { CompetitorSnapshot } from '../entities/CompetitorSnapshot';

export interface ICompetitorSnapshotRepository {
  findById(id: string): Promise<CompetitorSnapshot | null>;
  findAll(): Promise<CompetitorSnapshot[]>;
  save(snapshot: CompetitorSnapshot): Promise<CompetitorSnapshot>;
  update(id: string, data: Partial<CompetitorSnapshot>): Promise<CompetitorSnapshot>;
  delete(id: string): Promise<void>;

  findByCompetitorId(competitorId: string, limit?: number): Promise<CompetitorSnapshot[]>;
  findByCompetitorIdInDateRange(
    competitorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CompetitorSnapshot[]>;
  findLatestByCompetitorId(competitorId: string): Promise<CompetitorSnapshot | null>;
}
