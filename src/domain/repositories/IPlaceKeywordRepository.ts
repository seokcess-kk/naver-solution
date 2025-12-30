import { PlaceKeyword } from '../entities/PlaceKeyword';
import { IBaseRepository } from './IBaseRepository';

/**
 * PlaceKeyword Repository Interface
 * Extends IBaseRepository with PlaceKeyword-specific query methods
 */
export interface IPlaceKeywordRepository extends IBaseRepository<PlaceKeyword> {
  /**
   * Find all place-keywords for a specific place
   * @param placeId - The place ID
   * @returns Array of place-keywords
   */
  findByPlaceId(placeId: string): Promise<PlaceKeyword[]>;

  /**
   * Find all active place-keywords for a specific place
   * @param placeId - The place ID
   * @returns Array of active place-keywords
   */
  findActiveByPlaceId(placeId: string): Promise<PlaceKeyword[]>;

  /**
   * Find a place-keyword by place, keyword, and region combination
   * @param placeId - The place ID
   * @param keywordId - The keyword ID
   * @param region - The region
   * @returns The place-keyword if found, null otherwise
   */
  findByPlaceAndKeyword(
    placeId: string,
    keywordId: string,
    region: string
  ): Promise<PlaceKeyword | null>;

  /**
   * Update the active status of a place-keyword
   * @param id - The place-keyword ID
   * @param isActive - The new active status
   */
  updateActiveStatus(id: string, isActive: boolean): Promise<void>;
}
