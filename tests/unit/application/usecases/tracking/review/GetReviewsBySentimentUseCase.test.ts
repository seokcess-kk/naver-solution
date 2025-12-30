import { GetReviewsBySentimentUseCase } from '@application/usecases/tracking/review/GetReviewsBySentimentUseCase';
import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Review } from '@domain/entities/Review';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetReviewsBySentimentUseCase', () => {
  let useCase: GetReviewsBySentimentUseCase;
  let mockReviewRepository: jest.Mocked<IReviewRepository>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockReviewRepository = MockFactory.createReviewRepository();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new GetReviewsBySentimentUseCase(mockReviewRepository, mockPlaceRepository);
  });

  describe('execute', () => {
    const placeId = 'place-123';
    const sentiment = 'POSITIVE';

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

    const createMockReview = (id: string, sentiment: string, score: number): Review => ({
      id,
      place: mockPlace,
      naverReviewId: `review-${id}`,
      reviewType: 'BLOG',
      content: 'Test review content',
      rating: 5,
      author: 'Test Author',
      sentiment,
      sentimentScore: score,
      publishedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
    });

    const mockPositiveReviews: Review[] = [
      createMockReview('1', 'POSITIVE', 0.85),
      createMockReview('2', 'POSITIVE', 0.92),
      createMockReview('3', 'POSITIVE', 0.78),
    ];

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should return reviews with POSITIVE sentiment', async () => {
        mockReviewRepository.findBySentiment.mockResolvedValue(mockPositiveReviews);

        const result = await useCase.execute(placeId, 'POSITIVE');

        expect(result).toHaveLength(3);
        expect(result[0].sentiment).toBe('POSITIVE');
        expect(result[1].sentiment).toBe('POSITIVE');
        expect(result[2].sentiment).toBe('POSITIVE');
      });

      it('should return reviews with NEGATIVE sentiment', async () => {
        const mockNegativeReviews: Review[] = [
          createMockReview('4', 'NEGATIVE', -0.75),
          createMockReview('5', 'NEGATIVE', -0.82),
        ];
        mockReviewRepository.findBySentiment.mockResolvedValue(mockNegativeReviews);

        const result = await useCase.execute(placeId, 'NEGATIVE');

        expect(result).toHaveLength(2);
        expect(result[0].sentiment).toBe('NEGATIVE');
        expect(result[1].sentiment).toBe('NEGATIVE');
      });

      it('should return reviews with NEUTRAL sentiment', async () => {
        const mockNeutralReviews: Review[] = [createMockReview('6', 'NEUTRAL', 0.0)];
        mockReviewRepository.findBySentiment.mockResolvedValue(mockNeutralReviews);

        const result = await useCase.execute(placeId, 'NEUTRAL');

        expect(result).toHaveLength(1);
        expect(result[0].sentiment).toBe('NEUTRAL');
      });

      it('should validate Place exists', async () => {
        mockReviewRepository.findBySentiment.mockResolvedValue([]);

        await useCase.execute(placeId, sentiment);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(placeId);
      });

      it('should call repository with correct parameters', async () => {
        mockReviewRepository.findBySentiment.mockResolvedValue(mockPositiveReviews);

        await useCase.execute(placeId, sentiment);

        expect(mockReviewRepository.findBySentiment).toHaveBeenCalledWith(placeId, sentiment);
      });

      it('should return ReviewResponseDto array', async () => {
        mockReviewRepository.findBySentiment.mockResolvedValue(mockPositiveReviews);

        const result = await useCase.execute(placeId, sentiment);

        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('placeId');
        expect(result[0]).toHaveProperty('sentiment');
        expect(result[0]).toHaveProperty('sentimentScore');
        expect(result[0]).toHaveProperty('createdAt');
      });
    });

    describe('Empty Results', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should return empty array when no reviews exist', async () => {
        mockReviewRepository.findBySentiment.mockResolvedValue([]);

        const result = await useCase.execute(placeId, sentiment);

        expect(result).toEqual([]);
      });

      it('should return empty array when no reviews match sentiment', async () => {
        mockReviewRepository.findBySentiment.mockResolvedValue([]);

        const result = await useCase.execute(placeId, 'NEGATIVE');

        expect(result).toEqual([]);
      });
    });

    describe('Error Cases - Validation', () => {
      it('should throw NotFoundError when Place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(placeId, sentiment)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(placeId, sentiment)).rejects.toThrow(
          `Place with id ${placeId} not found`
        );
      });

      it('should throw BadRequestError for invalid sentiment', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);

        await expect(useCase.execute(placeId, 'INVALID')).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(placeId, 'INVALID')).rejects.toThrow(
          'Invalid sentiment. Must be one of: POSITIVE, NEGATIVE, NEUTRAL'
        );
      });

      it('should throw BadRequestError for lowercase sentiment', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);

        await expect(useCase.execute(placeId, 'positive')).rejects.toThrow(BadRequestError);
      });

      it('should throw BadRequestError for empty sentiment', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);

        await expect(useCase.execute(placeId, '')).rejects.toThrow(BadRequestError);
      });
    });

    describe('Error Cases - Repository Errors', () => {
      it('should propagate repository errors when finding Place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(placeId, sentiment)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding reviews', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to fetch reviews');
        mockReviewRepository.findBySentiment.mockRejectedValue(error);

        await expect(useCase.execute(placeId, sentiment)).rejects.toThrow(error);
      });
    });

    describe('Sentiment Values', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findBySentiment.mockResolvedValue([]);
      });

      it('should accept POSITIVE sentiment', async () => {
        await expect(useCase.execute(placeId, 'POSITIVE')).resolves.not.toThrow();
      });

      it('should accept NEGATIVE sentiment', async () => {
        await expect(useCase.execute(placeId, 'NEGATIVE')).resolves.not.toThrow();
      });

      it('should accept NEUTRAL sentiment', async () => {
        await expect(useCase.execute(placeId, 'NEUTRAL')).resolves.not.toThrow();
      });

      it('should reject other values', async () => {
        await expect(useCase.execute(placeId, 'MIXED')).rejects.toThrow(BadRequestError);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findBySentiment.mockResolvedValue(mockPositiveReviews);
      });

      it('should validate Place before fetching reviews', async () => {
        await useCase.execute(placeId, sentiment);

        const findPlaceCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const findReviewsCall = mockReviewRepository.findBySentiment.mock.invocationCallOrder[0];

        expect(findPlaceCall).toBeLessThan(findReviewsCall);
      });

      it('should validate sentiment before fetching reviews', async () => {
        await expect(useCase.execute(placeId, 'INVALID')).rejects.toThrow();

        // Should throw before calling repository
        expect(mockReviewRepository.findBySentiment).not.toHaveBeenCalled();
      });

      it('should not fetch reviews if Place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(placeId, sentiment)).rejects.toThrow();

        expect(mockReviewRepository.findBySentiment).not.toHaveBeenCalled();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should handle large number of reviews', async () => {
        const manyReviews = Array.from({ length: 1000 }, (_, i) =>
          createMockReview(`${i}`, 'POSITIVE', 0.8)
        );
        mockReviewRepository.findBySentiment.mockResolvedValue(manyReviews);

        const result = await useCase.execute(placeId, sentiment);

        expect(result).toHaveLength(1000);
      });

      it('should handle different Place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        mockReviewRepository.findBySentiment.mockResolvedValue([]);

        await useCase.execute(uuidPlaceId, sentiment);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
      });

      it('should handle reviews with null sentimentScore', async () => {
        const reviewsWithNullScore: Review[] = [
          { ...createMockReview('7', 'POSITIVE', 0.0), sentimentScore: null },
        ];
        mockReviewRepository.findBySentiment.mockResolvedValue(reviewsWithNullScore);

        const result = await useCase.execute(placeId, sentiment);

        expect(result[0].sentimentScore).toBeNull();
      });
    });

    describe('Response DTO Mapping', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should include all Review fields in response', async () => {
        mockReviewRepository.findBySentiment.mockResolvedValue(mockPositiveReviews);

        const result = await useCase.execute(placeId, sentiment);

        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('placeId');
        expect(result[0]).toHaveProperty('naverReviewId');
        expect(result[0]).toHaveProperty('reviewType');
        expect(result[0]).toHaveProperty('content');
        expect(result[0]).toHaveProperty('rating');
        expect(result[0]).toHaveProperty('author');
        expect(result[0]).toHaveProperty('sentiment');
        expect(result[0]).toHaveProperty('sentimentScore');
        expect(result[0]).toHaveProperty('publishedAt');
        expect(result[0]).toHaveProperty('createdAt');
      });

      it('should map placeId correctly', async () => {
        mockReviewRepository.findBySentiment.mockResolvedValue(mockPositiveReviews);

        const result = await useCase.execute(placeId, sentiment);

        expect(result[0].placeId).toBe(placeId);
      });
    });
  });
});
