import { GetPlaceReviewsUseCase } from '@application/usecases/tracking/review/GetPlaceReviewsUseCase';
import { GetReviewsDto } from '@application/dtos/tracking/review/GetReviewsDto';
import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Review } from '@domain/entities/Review';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetPlaceReviewsUseCase', () => {
  let useCase: GetPlaceReviewsUseCase;
  let mockReviewRepository: jest.Mocked<IReviewRepository>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockReviewRepository = MockFactory.createReviewRepository();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new GetPlaceReviewsUseCase(mockReviewRepository, mockPlaceRepository);
  });

  describe('execute', () => {
    const placeId = 'place-123';

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
      id: placeId,
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

    const createMockReview = (
      id: string,
      reviewType: string,
      sentiment: string | null,
      publishedAt: Date
    ): Review => ({
      id,
      place: mockPlace,
      naverReviewId: `review-${id}`,
      reviewType,
      content: 'Test review content',
      rating: 5,
      author: 'Test Author',
      sentiment,
      sentimentScore: sentiment === 'POSITIVE' ? 0.8 : sentiment === 'NEGATIVE' ? -0.7 : 0.0,
      publishedAt,
      createdAt: publishedAt,
    });

    const mockReviews: Review[] = [
      createMockReview('1', 'BLOG', 'POSITIVE', new Date('2024-01-10')),
      createMockReview('2', 'VISITOR', 'NEGATIVE', new Date('2024-01-12')),
      createMockReview('3', 'BLOG', 'NEUTRAL', new Date('2024-01-15')),
      createMockReview('4', 'VISITOR', 'POSITIVE', new Date('2024-01-18')),
      createMockReview('5', 'OTHER', 'NEUTRAL', new Date('2024-01-20')),
    ];

    describe('Happy Path - No Filters', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should return all reviews with default limit', async () => {
        const dto: GetReviewsDto = { placeId };
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(5);
        expect(mockReviewRepository.findByPlaceId).toHaveBeenCalledWith(placeId, 100);
      });

      it('should return reviews with custom limit', async () => {
        const dto: GetReviewsDto = { placeId, limit: 3 };
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews.slice(0, 3));

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(3);
        expect(mockReviewRepository.findByPlaceId).toHaveBeenCalledWith(placeId, 3);
      });

      it('should validate Place exists', async () => {
        const dto: GetReviewsDto = { placeId };
        mockReviewRepository.findByPlaceId.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(placeId);
      });

      it('should return ReviewResponseDto array', async () => {
        const dto: GetReviewsDto = { placeId };
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews);

        const result = await useCase.execute(dto);

        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('placeId');
        expect(result[0]).toHaveProperty('reviewType');
        expect(result[0]).toHaveProperty('createdAt');
      });
    });

    describe('Filter by Sentiment', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should filter by POSITIVE sentiment', async () => {
        const dto: GetReviewsDto = { placeId, sentiment: 'POSITIVE' };
        const positiveReviews = mockReviews.filter((r) => r.sentiment === 'POSITIVE');
        mockReviewRepository.findBySentiment.mockResolvedValue(positiveReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(2);
        expect(mockReviewRepository.findBySentiment).toHaveBeenCalledWith(placeId, 'POSITIVE');
      });

      it('should filter by NEGATIVE sentiment', async () => {
        const dto: GetReviewsDto = { placeId, sentiment: 'NEGATIVE' };
        const negativeReviews = mockReviews.filter((r) => r.sentiment === 'NEGATIVE');
        mockReviewRepository.findBySentiment.mockResolvedValue(negativeReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1);
        expect(result[0].sentiment).toBe('NEGATIVE');
      });

      it('should filter by NEUTRAL sentiment', async () => {
        const dto: GetReviewsDto = { placeId, sentiment: 'NEUTRAL' };
        const neutralReviews = mockReviews.filter((r) => r.sentiment === 'NEUTRAL');
        mockReviewRepository.findBySentiment.mockResolvedValue(neutralReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(2);
      });

      it('should not call findByPlaceId when sentiment filter is provided', async () => {
        const dto: GetReviewsDto = { placeId, sentiment: 'POSITIVE' };
        mockReviewRepository.findBySentiment.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockReviewRepository.findByPlaceId).not.toHaveBeenCalled();
      });
    });

    describe('Filter by PublishedAfter', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should filter by publishedAfter date', async () => {
        const publishedAfter = new Date('2024-01-14');
        const dto: GetReviewsDto = { placeId, publishedAfter };
        const recentReviews = mockReviews.filter((r) => r.publishedAt! >= publishedAfter);
        mockReviewRepository.findRecentByPlaceId.mockResolvedValue(recentReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(3); // Reviews from 2024-01-15, 01-18, 01-20
        expect(mockReviewRepository.findRecentByPlaceId).toHaveBeenCalledWith(
          placeId,
          expect.any(Number)
        );
      });

      it('should calculate days ago correctly', async () => {
        const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const dto: GetReviewsDto = { placeId, publishedAfter };
        mockReviewRepository.findRecentByPlaceId.mockResolvedValue([]);

        await useCase.execute(dto);

        // Should calculate approximately 7-8 days (due to Math.ceil rounding)
        const callArgs = mockReviewRepository.findRecentByPlaceId.mock.calls[0];
        expect(callArgs[0]).toBe(placeId);
        expect(callArgs[1]).toBeGreaterThanOrEqual(7);
        expect(callArgs[1]).toBeLessThanOrEqual(8);
      });

      it('should not call findByPlaceId when publishedAfter filter is provided', async () => {
        const dto: GetReviewsDto = { placeId, publishedAfter: new Date() };
        mockReviewRepository.findRecentByPlaceId.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockReviewRepository.findByPlaceId).not.toHaveBeenCalled();
      });
    });

    describe('Filter by ReviewType (In-Memory)', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews);
      });

      it('should filter by BLOG reviewType', async () => {
        const dto: GetReviewsDto = { placeId, reviewType: 'BLOG' };

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(2);
        expect(result.every((r) => r.reviewType === 'BLOG')).toBe(true);
      });

      it('should filter by VISITOR reviewType', async () => {
        const dto: GetReviewsDto = { placeId, reviewType: 'VISITOR' };

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(2);
        expect(result.every((r) => r.reviewType === 'VISITOR')).toBe(true);
      });

      it('should filter by OTHER reviewType', async () => {
        const dto: GetReviewsDto = { placeId, reviewType: 'OTHER' };

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1);
        expect(result[0].reviewType).toBe('OTHER');
      });

      it('should apply reviewType filter after fetching from repository', async () => {
        const dto: GetReviewsDto = { placeId, reviewType: 'BLOG' };

        await useCase.execute(dto);

        // Should fetch all first, then filter
        expect(mockReviewRepository.findByPlaceId).toHaveBeenCalledWith(placeId, 100);
      });
    });

    describe('Combined Filters', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should combine sentiment and reviewType filters', async () => {
        const dto: GetReviewsDto = { placeId, sentiment: 'POSITIVE', reviewType: 'BLOG' };
        const positiveReviews = mockReviews.filter((r) => r.sentiment === 'POSITIVE');
        mockReviewRepository.findBySentiment.mockResolvedValue(positiveReviews);

        const result = await useCase.execute(dto);

        // Should have 1 BLOG review with POSITIVE sentiment
        expect(result).toHaveLength(1);
        expect(result[0].reviewType).toBe('BLOG');
        expect(result[0].sentiment).toBe('POSITIVE');
      });

      it('should combine sentiment and limit', async () => {
        const dto: GetReviewsDto = { placeId, sentiment: 'POSITIVE', limit: 1 };
        const positiveReviews = mockReviews.filter((r) => r.sentiment === 'POSITIVE');
        mockReviewRepository.findBySentiment.mockResolvedValue(positiveReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1);
      });

      it('should combine publishedAfter and reviewType', async () => {
        const publishedAfter = new Date('2024-01-14');
        const dto: GetReviewsDto = { placeId, publishedAfter, reviewType: 'VISITOR' };
        const recentReviews = mockReviews.filter((r) => r.publishedAt! >= publishedAfter);
        mockReviewRepository.findRecentByPlaceId.mockResolvedValue(recentReviews);

        const result = await useCase.execute(dto);

        // Should have 1 VISITOR review after 2024-01-14
        expect(result).toHaveLength(1);
        expect(result[0].reviewType).toBe('VISITOR');
      });

      it('should apply limit after all filters', async () => {
        const dto: GetReviewsDto = { placeId, reviewType: 'BLOG', limit: 1 };
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1);
      });
    });

    describe('Limit Application', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should apply limit after filtering', async () => {
        const dto: GetReviewsDto = { placeId, reviewType: 'BLOG', limit: 1 };
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1);
      });

      it('should not apply limit if result count is less than limit', async () => {
        const dto: GetReviewsDto = { placeId, limit: 10 };
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(5); // All reviews returned
      });

      it('should handle limit of 1', async () => {
        const dto: GetReviewsDto = { placeId, limit: 1 };
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1);
      });

      it('should handle very large limit', async () => {
        const dto: GetReviewsDto = { placeId, limit: 1000 };
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(5); // All available reviews
      });
    });

    describe('Empty Results', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should return empty array when no reviews exist', async () => {
        const dto: GetReviewsDto = { placeId };
        mockReviewRepository.findByPlaceId.mockResolvedValue([]);

        const result = await useCase.execute(dto);

        expect(result).toEqual([]);
      });

      it('should return empty array when no reviews match filters', async () => {
        const dto: GetReviewsDto = { placeId, sentiment: 'POSITIVE', reviewType: 'OTHER' };
        const positiveReviews = mockReviews.filter((r) => r.sentiment === 'POSITIVE');
        mockReviewRepository.findBySentiment.mockResolvedValue(positiveReviews);

        const result = await useCase.execute(dto);

        expect(result).toEqual([]); // No POSITIVE + OTHER combination
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when Place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);
        const dto: GetReviewsDto = { placeId };

        await expect(useCase.execute(dto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(dto)).rejects.toThrow(
          `Place with id ${placeId} not found`
        );
      });

      it('should propagate repository errors when finding Place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);
        const dto: GetReviewsDto = { placeId };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding reviews by Place', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to fetch reviews');
        mockReviewRepository.findByPlaceId.mockRejectedValue(error);
        const dto: GetReviewsDto = { placeId };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding reviews by sentiment', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to fetch reviews');
        mockReviewRepository.findBySentiment.mockRejectedValue(error);
        const dto: GetReviewsDto = { placeId, sentiment: 'POSITIVE' };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding recent reviews', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to fetch reviews');
        mockReviewRepository.findRecentByPlaceId.mockRejectedValue(error);
        const dto: GetReviewsDto = { placeId, publishedAfter: new Date() };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should validate Place before fetching reviews', async () => {
        const dto: GetReviewsDto = { placeId };
        mockReviewRepository.findByPlaceId.mockResolvedValue([]);

        await useCase.execute(dto);

        const findPlaceCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const findReviewsCall = mockReviewRepository.findByPlaceId.mock.invocationCallOrder[0];

        expect(findPlaceCall).toBeLessThan(findReviewsCall);
      });

      it('should not fetch reviews if Place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);
        const dto: GetReviewsDto = { placeId };

        await expect(useCase.execute(dto)).rejects.toThrow();

        expect(mockReviewRepository.findByPlaceId).not.toHaveBeenCalled();
        expect(mockReviewRepository.findBySentiment).not.toHaveBeenCalled();
        expect(mockReviewRepository.findRecentByPlaceId).not.toHaveBeenCalled();
      });
    });

    describe('Filter Priority', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should prioritize sentiment filter over publishedAfter', async () => {
        const dto: GetReviewsDto = {
          placeId,
          sentiment: 'POSITIVE',
          publishedAfter: new Date(),
        };
        mockReviewRepository.findBySentiment.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockReviewRepository.findBySentiment).toHaveBeenCalled();
        expect(mockReviewRepository.findRecentByPlaceId).not.toHaveBeenCalled();
      });

      it('should prioritize sentiment filter over no filter', async () => {
        const dto: GetReviewsDto = {
          placeId,
          sentiment: 'POSITIVE',
          limit: 50,
        };
        mockReviewRepository.findBySentiment.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockReviewRepository.findBySentiment).toHaveBeenCalled();
        expect(mockReviewRepository.findByPlaceId).not.toHaveBeenCalled();
      });

      it('should prioritize publishedAfter filter over no filter', async () => {
        const dto: GetReviewsDto = {
          placeId,
          publishedAfter: new Date(),
          limit: 50,
        };
        mockReviewRepository.findRecentByPlaceId.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockReviewRepository.findRecentByPlaceId).toHaveBeenCalled();
        expect(mockReviewRepository.findByPlaceId).not.toHaveBeenCalled();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByPlaceId.mockResolvedValue(mockReviews);
      });

      it('should handle different Place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        const dto: GetReviewsDto = { placeId: uuidPlaceId };

        await useCase.execute(dto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
      });

      it('should handle reviews with null publishedAt', async () => {
        const reviewsWithNullDate: Review[] = [
          { ...mockReviews[0], publishedAt: null },
        ];
        mockReviewRepository.findByPlaceId.mockResolvedValue(reviewsWithNullDate);
        const dto: GetReviewsDto = { placeId };

        const result = await useCase.execute(dto);

        expect(result[0].publishedAt).toBeNull();
      });
    });
  });
});
