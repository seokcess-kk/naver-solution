import { Place } from '../entities/Place';
import { IBaseRepository, PaginatedResult, PaginationOptions } from './IBaseRepository';

/**
 * Place Repository Interface
 * Extends IBaseRepository with Place-specific query methods
 */
export interface IPlaceRepository extends IBaseRepository<Place> {
  /**
   * Find all places for a specific user with optional pagination
   * @param userId - The user ID
   * @param options - Pagination options
   * @returns Paginated places
   */
  findByUserId(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Place>>;

  /**
   * Find a place by its Naver Place ID
   * @param naverPlaceId - The Naver Place ID
   * @returns The place if found, null otherwise
   */
  findByNaverPlaceId(naverPlaceId: string): Promise<Place | null>;

  /**
   * Find all active places for a specific user
   * @param userId - The user ID
   * @returns Array of active places
   */
  findActiveByUserId(userId: string): Promise<Place[]>;

  /**
   * Update the active status of a place
   * @param id - The place ID
   * @param isActive - The new active status
   */
  updateActiveStatus(id: string, isActive: boolean): Promise<void>;
}
