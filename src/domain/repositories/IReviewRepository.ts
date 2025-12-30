import { Review } from '../entities/Review';
import { IBaseRepository } from './IBaseRepository';

/**
 * Review Repository Interface
 * Extends IBaseRepository with Review-specific query methods
 */
export interface IReviewRepository extends IBaseRepository<Review> {
  /**
   * Find reviews for a specific place
   * @param placeId - The place ID
   * @param limit - Optional limit for results
   * @returns Array of reviews
   */
  findByPlaceId(placeId: string, limit?: number): Promise<Review[]>;

  /**
   * Find a review by its Naver Review ID
   * @param naverReviewId - The Naver Review ID
   * @returns The review if found, null otherwise
   */
  findByNaverReviewId(naverReviewId: string): Promise<Review | null>;

  /**
   * Find reviews by sentiment for a specific place
   * @param placeId - The place ID
   * @param sentiment - The sentiment ('positive', 'negative', 'neutral')
   * @returns Array of reviews with matching sentiment
   */
  findBySentiment(placeId: string, sentiment: string): Promise<Review[]>;

  /**
   * Find recent reviews for a place within specified days
   * @param placeId - The place ID
   * @param days - Number of days to look back
   * @returns Array of recent reviews
   */
  findRecentByPlaceId(placeId: string, days: number): Promise<Review[]>;
}
