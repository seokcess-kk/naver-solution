import { Exclude, Expose } from 'class-transformer';
import { Review } from '@domain/entities/Review';

@Exclude()
export class ReviewResponseDto {
  @Expose()
  id: string;

  @Expose()
  placeId: string;

  @Expose()
  naverReviewId: string | null;

  @Expose()
  reviewType: string;

  @Expose()
  content: string | null;

  @Expose()
  rating: number | null;

  @Expose()
  author: string | null;

  @Expose()
  sentiment: string | null;

  @Expose()
  sentimentScore: number | null;

  @Expose()
  publishedAt: Date | null;

  @Expose()
  createdAt: Date;

  static fromEntity(review: Review): ReviewResponseDto {
    const dto = new ReviewResponseDto();
    dto.id = review.id;
    dto.placeId = review.place.id;
    dto.naverReviewId = review.naverReviewId;
    dto.reviewType = review.reviewType;
    dto.content = review.content;
    dto.rating = review.rating;
    dto.author = review.author;
    dto.sentiment = review.sentiment;
    dto.sentimentScore = review.sentimentScore;
    dto.publishedAt = review.publishedAt;
    dto.createdAt = review.createdAt;

    return dto;
  }
}
