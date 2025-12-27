import { ReviewHistory } from '../entities/ReviewHistory';

export interface IReviewHistoryRepository {
  findById(id: string): Promise<ReviewHistory | null>;
  findAll(): Promise<ReviewHistory[]>;
  save(reviewHistory: ReviewHistory): Promise<ReviewHistory>;
  update(id: string, data: Partial<ReviewHistory>): Promise<ReviewHistory>;
  delete(id: string): Promise<void>;

  findByPlaceId(placeId: string, limit?: number): Promise<ReviewHistory[]>;
  findByPlaceIdInDateRange(
    placeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReviewHistory[]>;
  findLatestByPlaceId(placeId: string): Promise<ReviewHistory | null>;
}
