import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Review } from '@domain/entities/Review';
import { RecordReviewDto } from '@application/dtos/tracking/review/RecordReviewDto';
import { ReviewResponseDto } from '@application/dtos/tracking/review/ReviewResponseDto';
import { NotFoundError, ConflictError, BadRequestError } from '@application/errors/HttpError';

export class RecordReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly placeRepository: IPlaceRepository
  ) {}

  async execute(dto: RecordReviewDto): Promise<ReviewResponseDto> {
    // 1. Validate Place exists
    const place = await this.placeRepository.findById(dto.placeId);
    if (!place) {
      throw new NotFoundError(`Place with id ${dto.placeId} not found`);
    }

    // 2. Check for duplicate naverReviewId
    if (dto.naverReviewId) {
      const existing = await this.reviewRepository.findByNaverReviewId(dto.naverReviewId);
      if (existing) {
        throw new ConflictError(`Review with naverReviewId ${dto.naverReviewId} already exists`);
      }
    }

    // 3. Business Rule: Sentiment validation
    if (dto.sentiment && !dto.sentimentScore) {
      throw new BadRequestError('sentimentScore required when sentiment is provided');
    }

    // 4. Create Review entity
    const review = new Review();
    review.place = place;
    review.naverReviewId = dto.naverReviewId || null;
    review.reviewType = dto.reviewType;
    review.content = dto.content || null;
    review.rating = dto.rating || null;
    review.author = dto.author || null;
    review.sentiment = dto.sentiment || null;
    review.sentimentScore = dto.sentimentScore || null;
    review.publishedAt = dto.publishedAt || null;

    // 5. Save to repository
    const saved = await this.reviewRepository.save(review);

    // 6. Convert to DTO and return
    return ReviewResponseDto.fromEntity(saved);
  }
}
