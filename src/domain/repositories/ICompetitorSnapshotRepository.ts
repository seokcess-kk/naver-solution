import { CompetitorSnapshot } from '../entities/CompetitorSnapshot';
import { IBaseRepository } from './IBaseRepository';

/**
 * CompetitorSnapshot Repository Interface
 * Extends IBaseRepository with CompetitorSnapshot-specific query methods
 */
export interface ICompetitorSnapshotRepository extends IBaseRepository<CompetitorSnapshot> {
  /**
   * Find snapshots for a specific competitor
   * @param competitorId - The competitor ID
   * @param limit - Optional limit for results
   * @returns Array of competitor snapshots
   */
  findByCompetitorId(competitorId: string, limit?: number): Promise<CompetitorSnapshot[]>;

  /**
   * Find competitor snapshots within date range
   * @param competitorId - The competitor ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of competitor snapshots
   */
  findByCompetitorIdInDateRange(
    competitorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CompetitorSnapshot[]>;

  /**
   * Find the latest snapshot for a competitor
   * @param competitorId - The competitor ID
   * @returns The latest snapshot if found, null otherwise
   */
  findLatestByCompetitorId(competitorId: string): Promise<CompetitorSnapshot | null>;
}
