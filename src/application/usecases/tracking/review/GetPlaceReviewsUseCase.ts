import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Review } from '@domain/entities/Review';
import { GetReviewsDto } from '@application/dtos/tracking/review/GetReviewsDto';
import { ReviewResponseDto } from '@application/dtos/tracking/review/ReviewResponseDto';

export class GetPlaceReviewsUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly placeRepository: IPlaceRepository
  ) {}

  async execute(dto: GetReviewsDto): Promise<ReviewResponseDto[]> {
    // 1. Validate Place exists
    const place = await this.placeRepository.findById(dto.placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    // 2. Get reviews with optional filters
    let reviews: Review[];

    if (dto.sentiment) {
      // Filter by sentiment
      reviews = await this.reviewRepository.findBySentiment(dto.placeId, dto.sentiment);
    } else if (dto.publishedAfter) {
      // Filter by date
      const daysAgo = Math.ceil(
        (Date.now() - dto.publishedAfter.getTime()) / (1000 * 60 * 60 * 24)
      );
      reviews = await this.reviewRepository.findRecentByPlaceId(dto.placeId, daysAgo);
    } else {
      // Get all reviews with limit
      reviews = await this.reviewRepository.findByPlaceId(dto.placeId, dto.limit || 100);
    }

    // 3. Apply additional filters in-memory (reviewType)
    if (dto.reviewType) {
      reviews = reviews.filter((r) => r.reviewType === dto.reviewType);
    }

    // 4. Apply limit if needed (after filtering)
    if (dto.limit && reviews.length > dto.limit) {
      reviews = reviews.slice(0, dto.limit);
    }

    // 5. Convert to DTOs
    return reviews.map((r) => ReviewResponseDto.fromEntity(r));
  }
}
