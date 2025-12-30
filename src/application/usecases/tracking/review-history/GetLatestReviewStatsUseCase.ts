import { IReviewHistoryRepository } from '@domain/repositories/IReviewHistoryRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { ReviewHistoryResponseDto } from '@application/dtos/tracking/review-history/ReviewHistoryResponseDto';
import { NotFoundError } from '@application/errors/HttpError';

export class GetLatestReviewStatsUseCase {
  constructor(
    private readonly reviewHistoryRepository: IReviewHistoryRepository,
    private readonly placeRepository: IPlaceRepository
  ) {}

  async execute(placeId: string): Promise<ReviewHistoryResponseDto | null> {
    // 1. Validate Place exists
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new NotFoundError(`Place with id ${placeId} not found`);
    }

    // 2. Get latest review stats
    const latest = await this.reviewHistoryRepository.findLatestByPlaceId(placeId);

    // 3. Return null if no history exists
    if (!latest) {
      return null;
    }

    // 4. Convert to DTO with computed fields
    return ReviewHistoryResponseDto.fromEntity(latest, true);
  }
}
