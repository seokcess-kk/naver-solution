import { RankingHistory } from '../entities/RankingHistory';
import { IBaseRepository } from './IBaseRepository';

/**
 * RankingHistory Repository Interface
 * Extends IBaseRepository with RankingHistory-specific query methods
 */
export interface IRankingHistoryRepository extends IBaseRepository<RankingHistory> {
  /**
   * Find ranking history for a place-keyword
   * @param placeKeywordId - The place-keyword ID
   * @param limit - Optional limit for results
   * @returns Array of ranking histories
   */
  findByPlaceKeywordId(placeKeywordId: string, limit?: number): Promise<RankingHistory[]>;

  /**
   * Find ranking history for a place-keyword within date range
   * @param placeKeywordId - The place-keyword ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of ranking histories
   */
  findByPlaceKeywordIdInDateRange(
    placeKeywordId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RankingHistory[]>;

  /**
   * Find the latest ranking history for a place-keyword
   * @param placeKeywordId - The place-keyword ID
   * @returns The latest ranking history if found, null otherwise
   */
  findLatestByPlaceKeywordId(placeKeywordId: string): Promise<RankingHistory | null>;
}
