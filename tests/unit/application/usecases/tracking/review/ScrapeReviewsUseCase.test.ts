import { ScrapeReviewsUseCase } from '@application/usecases/tracking/review/ScrapeReviewsUseCase';
import { RecordReviewUseCase } from '@application/usecases/tracking/review/RecordReviewUseCase';
import { ScrapeReviewsDto } from '@application/dtos/tracking/review/ScrapeReviewsDto';
import {
  INaverScrapingService,
  NaverReviewResult,
} from '@infrastructure/naver/interfaces/INaverScrapingService';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { Review } from '@domain/entities/Review';
import { ReviewResponseDto } from '@application/dtos/tracking/review/ReviewResponseDto';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('ScrapeReviewsUseCase', () => {
  let useCase: ScrapeReviewsUseCase;
  let mockNaverScrapingService: jest.Mocked<INaverScrapingService>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;
  let mockReviewRepository: jest.Mocked<IReviewRepository>;
  let mockRecordReviewUseCase: jest.Mocked<RecordReviewUseCase>;

  beforeEach(() => {
    mockNaverScrapingService = MockFactory.createNaverScrapingService();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    mockReviewRepository = MockFactory.createReviewRepository();
    mockRecordReviewUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new ScrapeReviewsUseCase(
      mockNaverScrapingService,
      mockPlaceRepository,
      mockReviewRepository,
      mockRecordReviewUseCase
    );
  });

  describe('execute', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      places: [],
      notificationSettings: [],
      refreshTokens: [],
    };

    const mockPlace: Place = {
      id: 'place-123',
      user: mockUser,
      naverPlaceId: 'naver-123',
      name: 'Test Restaurant',
      category: 'Korean Restaurant',
      address: 'Seoul, Korea',
      naverPlaceUrl: 'https://naver.com/place/123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      placeKeywords: [],
      reviews: [],
      reviewHistories: [],
      competitors: [],
      notificationSettings: [],
      notificationLogs: [],
    };

    const validDto: ScrapeReviewsDto = {
      placeId: 'place-123',
      limit: 10,
    };

    const mockScrapedReviews: NaverReviewResult[] = [
      {
        naverReviewId: 'review-1',
        reviewType: 'BLOG',
        content: 'Great restaurant!',
        rating: 5,
        author: 'John Doe',
        publishedAt: new Date('2024-01-15'),
      },
      {
        naverReviewId: 'review-2',
        reviewType: 'VISITOR',
        content: 'Nice place',
        rating: 4,
        author: 'Jane Smith',
        publishedAt: new Date('2024-01-16'),
      },
      {
        naverReviewId: 'review-3',
        reviewType: 'OTHER',
        content: null,
        rating: null,
        author: null,
        publishedAt: null,
      },
    ];

    const mockReviewResponseDto: ReviewResponseDto = {
      id: 'review-id-123',
      placeId: 'place-123',
      naverReviewId: 'review-1',
      reviewType: 'BLOG',
      content: 'Great restaurant!',
      rating: 5,
      author: 'John Doe',
      sentiment: null,
      sentimentScore: null,
      publishedAt: new Date('2024-01-15'),
      createdAt: new Date(),
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockNaverScrapingService.scrapeReviews.mockResolvedValue(mockScrapedReviews);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        mockRecordReviewUseCase.execute.mockResolvedValue(mockReviewResponseDto);
      });

      it('should successfully scrape and save reviews', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.placeId).toBe(mockPlace.id);
        expect(result.scrapedCount).toBe(3);
        expect(result.savedCount).toBe(3);
        expect(result.duplicateCount).toBe(0);
        expect(result.failedCount).toBe(0);
        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.scrapedAt).toBeInstanceOf(Date);
      });

      it('should validate Place exists', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(validDto.placeId);
      });

      it('should call scraping service with correct parameters', async () => {
        await useCase.execute(validDto);

        expect(mockNaverScrapingService.scrapeReviews).toHaveBeenCalledWith(
          mockPlace.naverPlaceId,
          validDto.limit
        );
      });

      it('should check for duplicates before saving each review', async () => {
        await useCase.execute(validDto);

        expect(mockReviewRepository.findByNaverReviewId).toHaveBeenCalledTimes(3);
        expect(mockReviewRepository.findByNaverReviewId).toHaveBeenCalledWith('review-1');
        expect(mockReviewRepository.findByNaverReviewId).toHaveBeenCalledWith('review-2');
        expect(mockReviewRepository.findByNaverReviewId).toHaveBeenCalledWith('review-3');
      });

      it('should call RecordReviewUseCase for each non-duplicate review', async () => {
        await useCase.execute(validDto);

        expect(mockRecordReviewUseCase.execute).toHaveBeenCalledTimes(3);
      });

      it('should return ScrapeReviewsResponseDto', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('placeId');
        expect(result).toHaveProperty('scrapedCount');
        expect(result).toHaveProperty('savedCount');
        expect(result).toHaveProperty('duplicateCount');
        expect(result).toHaveProperty('failedCount');
        expect(result).toHaveProperty('executionTimeMs');
        expect(result).toHaveProperty('scrapedAt');
      });
    });

    describe('Validation Errors', () => {
      it('should throw NotFoundError when Place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Place with id ${validDto.placeId} not found`
        );
      });

      it('should throw BadRequestError when Place is inactive', async () => {
        const inactivePlace = { ...mockPlace, isActive: false };
        mockPlaceRepository.findById.mockResolvedValue(inactivePlace);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Cannot scrape reviews for inactive Place ${validDto.placeId}`
        );
      });

      it('should throw BadRequestError when naverPlaceId is missing', async () => {
        const placeWithoutNaverId = { ...mockPlace, naverPlaceId: null as any };
        mockPlaceRepository.findById.mockResolvedValue(placeWithoutNaverId);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          'Place naverPlaceId is required for scraping'
        );
      });
    });

    describe('Duplicate Handling', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockNaverScrapingService.scrapeReviews.mockResolvedValue(mockScrapedReviews);
      });

      it('should skip duplicate reviews', async () => {
        const existingReview = {
          id: 'existing-review-id',
          place: mockPlace,
          naverReviewId: 'review-1',
          reviewType: 'BLOG',
          content: 'Old content',
          rating: 5,
          author: 'John Doe',
          sentiment: null,
          sentimentScore: null,
          publishedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-10'),
        };

        mockReviewRepository.findByNaverReviewId
          .mockResolvedValueOnce(existingReview) // review-1 is duplicate
          .mockResolvedValueOnce(null) // review-2 is new
          .mockResolvedValueOnce(null); // review-3 is new
        mockRecordReviewUseCase.execute.mockResolvedValue(mockReviewResponseDto);

        const result = await useCase.execute(validDto);

        expect(result.scrapedCount).toBe(3);
        expect(result.savedCount).toBe(2);
        expect(result.duplicateCount).toBe(1);
        expect(result.failedCount).toBe(0);
        expect(mockRecordReviewUseCase.execute).toHaveBeenCalledTimes(2);
      });

      it('should continue processing after finding duplicates', async () => {
        mockReviewRepository.findByNaverReviewId
          .mockResolvedValueOnce(null) // review-1 is new
          .mockResolvedValueOnce({} as Review) // review-2 is duplicate
          .mockResolvedValueOnce(null); // review-3 is new
        mockRecordReviewUseCase.execute.mockResolvedValue(mockReviewResponseDto);

        const result = await useCase.execute(validDto);

        expect(result.savedCount).toBe(2);
        expect(result.duplicateCount).toBe(1);
      });

      it('should handle all reviews being duplicates', async () => {
        mockReviewRepository.findByNaverReviewId.mockResolvedValue({} as Review);

        const result = await useCase.execute(validDto);

        expect(result.scrapedCount).toBe(3);
        expect(result.savedCount).toBe(0);
        expect(result.duplicateCount).toBe(3);
        expect(result.failedCount).toBe(0);
        expect(mockRecordReviewUseCase.execute).not.toHaveBeenCalled();
      });
    });

    describe('Partial Failures', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockNaverScrapingService.scrapeReviews.mockResolvedValue(mockScrapedReviews);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
      });

      it('should continue processing after save failures', async () => {
        mockRecordReviewUseCase.execute
          .mockResolvedValueOnce(mockReviewResponseDto) // review-1 succeeds
          .mockRejectedValueOnce(new Error('Save failed')) // review-2 fails
          .mockResolvedValueOnce(mockReviewResponseDto); // review-3 succeeds

        const result = await useCase.execute(validDto);

        expect(result.scrapedCount).toBe(3);
        expect(result.savedCount).toBe(2);
        expect(result.duplicateCount).toBe(0);
        expect(result.failedCount).toBe(1);
      });

      it('should track all failed saves', async () => {
        mockRecordReviewUseCase.execute.mockRejectedValue(new Error('Save failed'));

        const result = await useCase.execute(validDto);

        expect(result.savedCount).toBe(0);
        expect(result.failedCount).toBe(3);
      });

      it('should allow partial success', async () => {
        mockRecordReviewUseCase.execute
          .mockResolvedValueOnce(mockReviewResponseDto)
          .mockRejectedValueOnce(new Error('Failed'))
          .mockResolvedValueOnce(mockReviewResponseDto);

        const result = await useCase.execute(validDto);

        expect(result.savedCount).toBe(2);
        expect(result.failedCount).toBe(1);
        expect(result.savedCount + result.failedCount).toBe(3);
      });
    });

    describe('Limit Handling', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        mockRecordReviewUseCase.execute.mockResolvedValue(mockReviewResponseDto);
      });

      it('should use provided limit', async () => {
        const dtoWithLimit: ScrapeReviewsDto = { placeId: 'place-123', limit: 5 };
        mockNaverScrapingService.scrapeReviews.mockResolvedValue([]);

        await useCase.execute(dtoWithLimit);

        expect(mockNaverScrapingService.scrapeReviews).toHaveBeenCalledWith(
          mockPlace.naverPlaceId,
          5
        );
      });

      it('should use default limit from environment when not provided', async () => {
        const dtoWithoutLimit: ScrapeReviewsDto = { placeId: 'place-123' };
        process.env.NAVER_REVIEW_SCRAPING_LIMIT = '20';
        mockNaverScrapingService.scrapeReviews.mockResolvedValue([]);

        await useCase.execute(dtoWithoutLimit);

        expect(mockNaverScrapingService.scrapeReviews).toHaveBeenCalledWith(
          mockPlace.naverPlaceId,
          20
        );
      });

      it('should use 10 as default limit when environment variable not set', async () => {
        delete process.env.NAVER_REVIEW_SCRAPING_LIMIT;
        const dtoWithoutLimit: ScrapeReviewsDto = { placeId: 'place-123' };
        mockNaverScrapingService.scrapeReviews.mockResolvedValue([]);

        await useCase.execute(dtoWithoutLimit);

        expect(mockNaverScrapingService.scrapeReviews).toHaveBeenCalledWith(
          mockPlace.naverPlaceId,
          10
        );
      });
    });

    describe('Empty Results', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should handle zero scraped reviews', async () => {
        mockNaverScrapingService.scrapeReviews.mockResolvedValue([]);

        const result = await useCase.execute(validDto);

        expect(result.scrapedCount).toBe(0);
        expect(result.savedCount).toBe(0);
        expect(result.duplicateCount).toBe(0);
        expect(result.failedCount).toBe(0);
        expect(mockRecordReviewUseCase.execute).not.toHaveBeenCalled();
      });
    });

    describe('Service Errors', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should propagate scraping service errors', async () => {
        const error = new Error('Network timeout');
        mockNaverScrapingService.scrapeReviews.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding Place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockNaverScrapingService.scrapeReviews.mockResolvedValue(mockScrapedReviews);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        mockRecordReviewUseCase.execute.mockResolvedValue(mockReviewResponseDto);
      });

      it('should validate Place before scraping', async () => {
        await useCase.execute(validDto);

        const findCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const scrapeCall = mockNaverScrapingService.scrapeReviews.mock.invocationCallOrder[0];

        expect(findCall).toBeLessThan(scrapeCall);
      });

      it('should scrape before checking duplicates', async () => {
        await useCase.execute(validDto);

        const scrapeCall = mockNaverScrapingService.scrapeReviews.mock.invocationCallOrder[0];
        const checkDuplicateCall =
          mockReviewRepository.findByNaverReviewId.mock.invocationCallOrder[0];

        expect(scrapeCall).toBeLessThan(checkDuplicateCall);
      });

      it('should check duplicate before recording each review', async () => {
        await useCase.execute(validDto);

        const checkDuplicateCall =
          mockReviewRepository.findByNaverReviewId.mock.invocationCallOrder[0];
        const recordCall = mockRecordReviewUseCase.execute.mock.invocationCallOrder[0];

        expect(checkDuplicateCall).toBeLessThan(recordCall);
      });

      it('should not scrape if Place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockNaverScrapingService.scrapeReviews).not.toHaveBeenCalled();
      });

      it('should not record if scraping fails', async () => {
        mockNaverScrapingService.scrapeReviews.mockRejectedValue(new Error('Scraping failed'));

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockRecordReviewUseCase.execute).not.toHaveBeenCalled();
      });
    });

    describe('DTO Mapping', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockNaverScrapingService.scrapeReviews.mockResolvedValue(mockScrapedReviews);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        mockRecordReviewUseCase.execute.mockResolvedValue(mockReviewResponseDto);
      });

      it('should map scraped review to RecordReviewDto correctly', async () => {
        await useCase.execute(validDto);

        expect(mockRecordReviewUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            placeId: mockPlace.id,
            naverReviewId: 'review-1',
            reviewType: 'BLOG',
            content: 'Great restaurant!',
            rating: 5,
            author: 'John Doe',
            publishedAt: expect.any(Date),
          })
        );
      });

      it('should handle null values in scraped review', async () => {
        await useCase.execute(validDto);

        // Check the third review with null values
        expect(mockRecordReviewUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            placeId: mockPlace.id,
            naverReviewId: 'review-3',
            reviewType: 'OTHER',
            content: undefined,
            rating: undefined,
            author: undefined,
            publishedAt: undefined,
          })
        );
      });

      it('should set sentiment fields to undefined', async () => {
        await useCase.execute(validDto);

        expect(mockRecordReviewUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            sentiment: undefined,
            sentimentScore: undefined,
          })
        );
      });
    });

    describe('Execution Time Tracking', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockNaverScrapingService.scrapeReviews.mockResolvedValue([]);
      });

      it('should track execution time', async () => {
        const result = await useCase.execute(validDto);

        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
        expect(typeof result.executionTimeMs).toBe('number');
      });

      it('should set scrapedAt timestamp', async () => {
        const before = new Date();
        const result = await useCase.execute(validDto);
        const after = new Date();

        expect(result.scrapedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(result.scrapedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockNaverScrapingService.scrapeReviews.mockResolvedValue([]);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        mockRecordReviewUseCase.execute.mockResolvedValue(mockReviewResponseDto);
      });

      it('should handle different Place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        const dtoWithUuid: ScrapeReviewsDto = {
          placeId: uuidPlaceId,
        };

        await useCase.execute(dtoWithUuid);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
      });

      it('should handle limit of 1', async () => {
        const dtoWithLimit1: ScrapeReviewsDto = { placeId: 'place-123', limit: 1 };
        mockNaverScrapingService.scrapeReviews.mockResolvedValue([mockScrapedReviews[0]]);

        const result = await useCase.execute(dtoWithLimit1);

        expect(result.scrapedCount).toBe(1);
      });

      it('should handle maximum limit of 50', async () => {
        const dtoWithMaxLimit: ScrapeReviewsDto = { placeId: 'place-123', limit: 50 };
        mockNaverScrapingService.scrapeReviews.mockResolvedValue([]);

        await useCase.execute(dtoWithMaxLimit);

        expect(mockNaverScrapingService.scrapeReviews).toHaveBeenCalledWith(
          mockPlace.naverPlaceId,
          50
        );
      });
    });
  });
});
