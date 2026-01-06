import { INaverScrapingService } from '@infrastructure/naver/interfaces/INaverScrapingService';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { RecordReviewUseCase } from './RecordReviewUseCase';
import { RecordReviewHistoryUseCase } from '../review-history/RecordReviewHistoryUseCase';
import { ScrapeReviewsDto } from '@application/dtos/tracking/review/ScrapeReviewsDto';
import { ScrapeReviewsResponseDto } from '@application/dtos/tracking/review/ScrapeReviewsResponseDto';
import { RecordReviewDto } from '@application/dtos/tracking/review/RecordReviewDto';
import { RecordReviewHistoryDto } from '@application/dtos/tracking/review-history/RecordReviewHistoryDto';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';

/**
 * Use case for scraping Naver reviews for a Place
 */
export class ScrapeReviewsUseCase {
  constructor(
    private readonly naverScrapingService: INaverScrapingService,
    private readonly placeRepository: IPlaceRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly recordReviewUseCase: RecordReviewUseCase,
    private readonly recordReviewHistoryUseCase: RecordReviewHistoryUseCase
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

    // 4. Execute Naver scraping (with review counts extraction)
    const limit = dto.limit || parseInt(process.env.NAVER_REVIEW_SCRAPING_LIMIT || '10', 10);
    const { reviews: scrapedReviews, counts } = await this.naverScrapingService.scrapeReviews(
      place.naverPlaceId,
      limit
    );

    console.log(
      `[ScrapeReviewsUseCase] Scraped ${scrapedReviews.length} reviews for place ${place.id}`
    );
    console.log('[ScrapeReviewsUseCase] Review counts:', counts);

    // 5. Save reviews to database (with duplicate handling)
    let savedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const savedReviews: RecordReviewDto[] = [];

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
        savedReviews.push(recordDto);
      } catch (error) {
        failedCount++;
        console.error(
          `[ScrapeReviewsUseCase] Failed to save review ${scrapedReview.naverReviewId}:`,
          error
        );
        // Continue with next review (partial success allowed)
      }
    }

    // 6. Calculate average rating from saved reviews
    const averageRating =
      savedReviews.length > 0
        ? savedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / savedReviews.length
        : null;

    // 7. Record review history (if counts were extracted)
    const countsExtracted = counts.visitorReviewCount !== null || counts.blogReviewCount !== null;

    if (countsExtracted) {
      try {
        const historyDto: RecordReviewHistoryDto = {
          placeId: place.id,
          visitorReviewCount: counts.visitorReviewCount ?? 0,
          blogReviewCount: counts.blogReviewCount ?? 0,
          averageRating: averageRating,
          checkedAt: scrapedAt,
        };

        await this.recordReviewHistoryUseCase.execute(historyDto);
        console.log('[ScrapeReviewsUseCase] Review history recorded successfully');
      } catch (error) {
        // History recording failure should not fail the entire operation
        console.error('[ScrapeReviewsUseCase] Failed to record review history:', error);
      }
    } else {
      console.log('[ScrapeReviewsUseCase] Review counts not extracted, skipping history record');
    }

    // 8. Calculate execution time
    const executionTimeMs = Date.now() - startTime;

    // 9. Return response DTO
    const response: ScrapeReviewsResponseDto = {
      placeId: place.id,
      scrapedCount: scrapedReviews.length,
      savedCount,
      duplicateCount,
      failedCount,
      visitorReviewCount: counts.visitorReviewCount,
      blogReviewCount: counts.blogReviewCount,
      countsExtracted,
      executionTimeMs,
      scrapedAt,
    };

    console.log(
      `[ScrapeReviewsUseCase] Completed: ${savedCount} saved, ${duplicateCount} duplicates, ${failedCount} failed in ${executionTimeMs}ms`
    );

    return response;
  }
}
