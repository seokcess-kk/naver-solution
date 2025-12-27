import { IReviewHistoryRepository } from '@domain/repositories/IReviewHistoryRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { ReviewHistory } from '@domain/entities/ReviewHistory';
import { RecordReviewHistoryDto } from '@application/dtos/tracking/review-history/RecordReviewHistoryDto';
import { ReviewHistoryResponseDto } from '@application/dtos/tracking/review-history/ReviewHistoryResponseDto';

export class RecordReviewHistoryUseCase {
  constructor(
    private readonly reviewHistoryRepository: IReviewHistoryRepository,
    private readonly placeRepository: IPlaceRepository
  ) {}

  async execute(dto: RecordReviewHistoryDto): Promise<ReviewHistoryResponseDto> {
    // 1. Validate Place exists
    const place = await this.placeRepository.findById(dto.placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    // 2. Business Rule: Place must be active
    if (!place.isActive) {
      throw new Error('Cannot record review history for inactive Place');
    }

    // 3. Create ReviewHistory entity
    const reviewHistory = new ReviewHistory();
    reviewHistory.place = place;
    reviewHistory.blogReviewCount = dto.blogReviewCount;
    reviewHistory.visitorReviewCount = dto.visitorReviewCount;
    reviewHistory.averageRating = dto.averageRating;
    reviewHistory.checkedAt = dto.checkedAt;

    // 4. Save to repository
    const saved = await this.reviewHistoryRepository.save(reviewHistory);

    // 5. Convert to DTO with computed fields
    return ReviewHistoryResponseDto.fromEntity(saved, true);
  }
}
