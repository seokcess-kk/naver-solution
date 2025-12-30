import { INaverScrapingService } from '@infrastructure/naver/interfaces/INaverScrapingService';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { RecordReviewUseCase } from './RecordReviewUseCase';
import { ScrapeReviewsDto } from '@application/dtos/tracking/review/ScrapeReviewsDto';
import { ScrapeReviewsResponseDto } from '@application/dtos/tracking/review/ScrapeReviewsResponseDto';
import { RecordReviewDto } from '@application/dtos/tracking/review/RecordReviewDto';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';

/**
 * Use case for scraping Naver reviews for a Place
 */
export class ScrapeReviewsUseCase {
  constructor(
    private readonly naverScrapingService: INaverScrapingService,
    private readonly placeRepository: IPlaceRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly recordReviewUseCase: RecordReviewUseCase
  ) {}

  async execute(dto: ScrapeReviewsDto): Promise<ScrapeReviewsResponseDto> {
    const startTime = Date.now();
    const scrapedAt = new Date();

    // 1. Validate Place exists
    const place = await this.placeRepository.findById(dto.placeId);
    if (!place) {
      throw new NotFoundError(`Place with id ${dto.placeId} not found`);
    }

    // 2. Validate Place is active
    if (!place.isActive) {
      throw new BadRequestError(`Cannot scrape reviews for inactive Place ${dto.placeId}`);
    }

    // 3. Validate naverPlaceId exists
    if (!place.naverPlaceId) {
      throw new BadRequestError('Place naverPlaceId is required for scraping');
    }

    // 4. Execute Naver scraping
    const limit = dto.limit || parseInt(process.env.NAVER_REVIEW_SCRAPING_LIMIT || '10', 10);
    const scrapedReviews = await this.naverScrapingService.scrapeReviews(
      place.naverPlaceId,
      limit
    );

    console.log(
      `[ScrapeReviewsUseCase] Scraped ${scrapedReviews.length} reviews for place ${place.id}`
    );

    // 5. Save reviews to database (with duplicate handling)
    let savedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    for (const scrapedReview of scrapedReviews) {
      try {
        // Check for duplicates before attempting to save
        const existing = await this.reviewRepository.findByNaverReviewId(
          scrapedReview.naverReviewId
        );

        if (existing) {
          duplicateCount++;
          console.log(
            `[ScrapeReviewsUseCase] Duplicate review skipped: ${scrapedReview.naverReviewId}`
          );
          continue;
        }

        // Create RecordReviewDto
        const recordDto: RecordReviewDto = {
          placeId: place.id,
          naverReviewId: scrapedReview.naverReviewId,
          reviewType: scrapedReview.reviewType,
          content: scrapedReview.content || undefined,
          rating: scrapedReview.rating || undefined,
          author: scrapedReview.author || undefined,
          sentiment: undefined, // Phase 7에서 처리
          sentimentScore: undefined, // Phase 7에서 처리
          publishedAt: scrapedReview.publishedAt || undefined,
        };

        // Save using RecordReviewUseCase
        await this.recordReviewUseCase.execute(recordDto);
        savedCount++;
      } catch (error) {
        failedCount++;
        console.error(
          `[ScrapeReviewsUseCase] Failed to save review ${scrapedReview.naverReviewId}:`,
          error
        );
        // Continue with next review (partial success allowed)
      }
    }

    // 6. Calculate execution time
    const executionTimeMs = Date.now() - startTime;

    // 7. Return response DTO
    const response: ScrapeReviewsResponseDto = {
      placeId: place.id,
      scrapedCount: scrapedReviews.length,
      savedCount,
      duplicateCount,
      failedCount,
      executionTimeMs,
      scrapedAt,
    };

    console.log(
      `[ScrapeReviewsUseCase] Completed: ${savedCount} saved, ${duplicateCount} duplicates, ${failedCount} failed in ${executionTimeMs}ms`
    );

    return response;
  }
}
