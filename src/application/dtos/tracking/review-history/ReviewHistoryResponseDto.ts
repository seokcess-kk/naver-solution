import { Exclude, Expose } from 'class-transformer';
import { ReviewHistory } from '@domain/entities/ReviewHistory';

@Exclude()
export class ReviewHistoryResponseDto {
  @Expose()
  id: string;

  @Expose()
  placeId: string;

  @Expose()
  blogReviewCount: number;

  @Expose()
  visitorReviewCount: number;

  @Expose()
  averageRating: number | null;

  @Expose()
  checkedAt: Date;

  @Expose()
  createdAt: Date;

  // Computed field
  @Expose()
  totalReviewCount?: number;

  static fromEntity(
    reviewHistory: ReviewHistory,
    includeComputed = false
  ): ReviewHistoryResponseDto {
    const dto = new ReviewHistoryResponseDto();
    dto.id = reviewHistory.id;
    dto.placeId = reviewHistory.place.id;
    dto.blogReviewCount = reviewHistory.blogReviewCount;
    dto.visitorReviewCount = reviewHistory.visitorReviewCount;
    dto.averageRating = reviewHistory.averageRating;
    dto.checkedAt = reviewHistory.checkedAt;
    dto.createdAt = reviewHistory.createdAt;

    if (includeComputed) {
      dto.totalReviewCount = reviewHistory.blogReviewCount + reviewHistory.visitorReviewCount;
    }

    return dto;
  }
}
