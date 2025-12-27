import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { ReviewResponseDto } from '@application/dtos/tracking/review/ReviewResponseDto';

export class GetReviewsBySentimentUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly placeRepository: IPlaceRepository
  ) {}

  async execute(placeId: string, sentiment: string): Promise<ReviewResponseDto[]> {
    // 1. Validate Place exists
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    // 2. Validate sentiment value
    const validSentiments = ['POSITIVE', 'NEGATIVE', 'NEUTRAL'];
    if (!validSentiments.includes(sentiment)) {
      throw new Error(`Invalid sentiment. Must be one of: ${validSentiments.join(', ')}`);
    }

    // 3. Get reviews by sentiment
    const reviews = await this.reviewRepository.findBySentiment(placeId, sentiment);

    // 4. Convert to DTOs
    return reviews.map((r) => ReviewResponseDto.fromEntity(r));
  }
}
