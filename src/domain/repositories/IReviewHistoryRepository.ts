import { ReviewHistory } from '../entities/ReviewHistory';
import { IBaseRepository } from './IBaseRepository';

/**
 * ReviewHistory Repository Interface
 * Extends IBaseRepository with ReviewHistory-specific query methods
 */
export interface IReviewHistoryRepository extends IBaseRepository<ReviewHistory> {
  /**
   * Find review history for a place
   * @param placeId - The place ID
   * @param limit - Optional limit for results
   * @returns Array of review histories
   */
  findByPlaceId(placeId: string, limit?: number): Promise<ReviewHistory[]>;

  /**
   * Find review history for a place within date range
   * @param placeId - The place ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of review histories
   */
  findByPlaceIdInDateRange(
    placeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReviewHistory[]>;

  /**
   * Find the latest review history for a place
   * @param placeId - The place ID
   * @returns The latest review history if found, null otherwise
   */
  findLatestByPlaceId(placeId: string): Promise<ReviewHistory | null>;
}
