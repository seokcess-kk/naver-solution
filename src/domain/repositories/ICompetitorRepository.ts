import { Competitor } from '../entities/Competitor';
import { IBaseRepository } from './IBaseRepository';

/**
 * Competitor Repository Interface
 * Extends IBaseRepository with Competitor-specific query methods
 */
export interface ICompetitorRepository extends IBaseRepository<Competitor> {
  /**
   * Find all competitors for a specific place
   * @param placeId - The place ID
   * @returns Array of competitors
   */
  findByPlaceId(placeId: string): Promise<Competitor[]>;

  /**
   * Find all active competitors for a specific place
   * @param placeId - The place ID
   * @returns Array of active competitors
   */
  findActiveByPlaceId(placeId: string): Promise<Competitor[]>;

  /**
   * Find a competitor by place and Naver Place ID
   * @param placeId - The place ID
   * @param competitorNaverPlaceId - The competitor's Naver Place ID
   * @returns The competitor if found, null otherwise
   */
  findByPlaceAndNaverId(
    placeId: string,
    competitorNaverPlaceId: string
  ): Promise<Competitor | null>;

  /**
   * Update the active status of a competitor
   * @param id - The competitor ID
   * @param isActive - The new active status
   */
  updateActiveStatus(id: string, isActive: boolean): Promise<void>;
}
