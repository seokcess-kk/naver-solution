import { Review } from '../entities/Review';

export interface IReviewRepository {
  findById(id: string): Promise<Review | null>;
  findAll(): Promise<Review[]>;
  save(review: Review): Promise<Review>;
  update(id: string, data: Partial<Review>): Promise<Review>;
  delete(id: string): Promise<void>;

  findByPlaceId(placeId: string, limit?: number): Promise<Review[]>;
  findByNaverReviewId(naverReviewId: string): Promise<Review | null>;
  findBySentiment(placeId: string, sentiment: string): Promise<Review[]>;
  findRecentByPlaceId(placeId: string, days: number): Promise<Review[]>;
}
