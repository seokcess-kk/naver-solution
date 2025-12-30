import { IReviewHistoryRepository } from '@domain/repositories/IReviewHistoryRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { ReviewHistory } from '@domain/entities/ReviewHistory';
import { GetReviewHistoryDto } from '@application/dtos/tracking/review-history/GetReviewHistoryDto';
import { ReviewHistoryResponseDto } from '@application/dtos/tracking/review-history/ReviewHistoryResponseDto';
import { NotFoundError } from '@application/errors/HttpError';

export class GetReviewHistoryUseCase {
  constructor(
    private readonly reviewHistoryRepository: IReviewHistoryRepository,
    private readonly placeRepository: IPlaceRepository
  ) {}

  async execute(dto: GetReviewHistoryDto): Promise<ReviewHistoryResponseDto[]> {
    // 1. Validate Place exists
    const place = await this.placeRepository.findById(dto.placeId);
    if (!place) {
      throw new NotFoundError(`Place with id ${dto.placeId} not found`);
    }

    // 2. Get history based on date range or limit
    let histories: ReviewHistory[];

    if (dto.startDate && dto.endDate) {
      histories = await this.reviewHistoryRepository.findByPlaceIdInDateRange(
        dto.placeId,
        dto.startDate,
        dto.endDate
      );
    } else {
      histories = await this.reviewHistoryRepository.findByPlaceId(dto.placeId, dto.limit || 100);
    }

    // 3. Convert to DTOs with computed fields
    return histories.map((h) => ReviewHistoryResponseDto.fromEntity(h, true));
  }
}
