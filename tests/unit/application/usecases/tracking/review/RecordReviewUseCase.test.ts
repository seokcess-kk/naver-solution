import { RecordReviewUseCase } from '@application/usecases/tracking/review/RecordReviewUseCase';
import { RecordReviewDto } from '@application/dtos/tracking/review/RecordReviewDto';
import { IReviewRepository } from '@domain/repositories/IReviewRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Review } from '@domain/entities/Review';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError, ConflictError, BadRequestError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('RecordReviewUseCase', () => {
  let useCase: RecordReviewUseCase;
  let mockReviewRepository: jest.Mocked<IReviewRepository>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockReviewRepository = MockFactory.createReviewRepository();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new RecordReviewUseCase(mockReviewRepository, mockPlaceRepository);
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

    const validDto: RecordReviewDto = {
      placeId: 'place-123',
      naverReviewId: 'review-123',
      reviewType: 'BLOG',
      content: 'Great restaurant!',
      rating: 5,
      author: 'John Doe',
      publishedAt: new Date('2024-01-15'),
    };

    const mockReview: Review = {
      id: 'review-id-123',
      place: mockPlace,
      naverReviewId: 'review-123',
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
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        mockReviewRepository.save.mockResolvedValue(mockReview);
      });

      it('should successfully record review with valid data', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.id).toBe(mockReview.id);
        expect(result.placeId).toBe(mockPlace.id);
        expect(result.naverReviewId).toBe(validDto.naverReviewId);
        expect(result.reviewType).toBe(validDto.reviewType);
        expect(result.content).toBe(validDto.content);
        expect(result.rating).toBe(validDto.rating);
        expect(result.author).toBe(validDto.author);
      });

      it('should validate Place exists', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(validDto.placeId);
      });

      it('should check for duplicate naverReviewId', async () => {
        await useCase.execute(validDto);

        expect(mockReviewRepository.findByNaverReviewId).toHaveBeenCalledWith(
          validDto.naverReviewId
        );
      });

      it('should save Review with correct data', async () => {
        await useCase.execute(validDto);

        expect(mockReviewRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            place: mockPlace,
            naverReviewId: validDto.naverReviewId,
            reviewType: validDto.reviewType,
            content: validDto.content,
            rating: validDto.rating,
            author: validDto.author,
            publishedAt: validDto.publishedAt,
          })
        );
      });

      it('should return ReviewResponseDto', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('placeId');
        expect(result).toHaveProperty('naverReviewId');
        expect(result).toHaveProperty('reviewType');
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('rating');
        expect(result).toHaveProperty('createdAt');
      });
    });

    describe('Error Cases - Validation', () => {
      it('should throw NotFoundError when Place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Place with id ${validDto.placeId} not found`
        );
      });

      it('should throw ConflictError when naverReviewId already exists', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(mockReview);

        await expect(useCase.execute(validDto)).rejects.toThrow(ConflictError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Review with naverReviewId ${validDto.naverReviewId} already exists`
        );
      });

      it('should throw BadRequestError when sentiment provided without sentimentScore', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);

        const dtoWithSentimentOnly: RecordReviewDto = {
          ...validDto,
          sentiment: 'POSITIVE',
          sentimentScore: undefined,
        };

        await expect(useCase.execute(dtoWithSentimentOnly)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(dtoWithSentimentOnly)).rejects.toThrow(
          'sentimentScore required when sentiment is provided'
        );
      });
    });

    describe('Error Cases - Repository Errors', () => {
      it('should propagate repository errors when finding Place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when checking duplicate', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to check duplicate');
        mockReviewRepository.findByNaverReviewId.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when saving Review', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        const error = new Error('Failed to save review');
        mockReviewRepository.save.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Optional Fields', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
      });

      it('should handle review without naverReviewId', async () => {
        const dtoWithoutNaverId: RecordReviewDto = {
          ...validDto,
          naverReviewId: undefined,
        };
        const reviewWithoutNaverId = { ...mockReview, naverReviewId: null };
        mockReviewRepository.save.mockResolvedValue(reviewWithoutNaverId);

        const result = await useCase.execute(dtoWithoutNaverId);

        expect(result.naverReviewId).toBeNull();
        expect(mockReviewRepository.findByNaverReviewId).not.toHaveBeenCalled();
      });

      it('should handle review without content', async () => {
        const dtoWithoutContent: RecordReviewDto = {
          ...validDto,
          content: undefined,
        };
        const reviewWithoutContent = { ...mockReview, content: null };
        mockReviewRepository.save.mockResolvedValue(reviewWithoutContent);

        const result = await useCase.execute(dtoWithoutContent);

        expect(result.content).toBeNull();
      });

      it('should handle review without rating', async () => {
        const dtoWithoutRating: RecordReviewDto = {
          ...validDto,
          rating: undefined,
        };
        const reviewWithoutRating = { ...mockReview, rating: null };
        mockReviewRepository.save.mockResolvedValue(reviewWithoutRating);

        const result = await useCase.execute(dtoWithoutRating);

        expect(result.rating).toBeNull();
      });

      it('should handle review without author', async () => {
        const dtoWithoutAuthor: RecordReviewDto = {
          ...validDto,
          author: undefined,
        };
        const reviewWithoutAuthor = { ...mockReview, author: null };
        mockReviewRepository.save.mockResolvedValue(reviewWithoutAuthor);

        const result = await useCase.execute(dtoWithoutAuthor);

        expect(result.author).toBeNull();
      });

      it('should handle review without publishedAt', async () => {
        const dtoWithoutPublishedAt: RecordReviewDto = {
          ...validDto,
          publishedAt: undefined,
        };
        const reviewWithoutPublishedAt = { ...mockReview, publishedAt: null };
        mockReviewRepository.save.mockResolvedValue(reviewWithoutPublishedAt);

        const result = await useCase.execute(dtoWithoutPublishedAt);

        expect(result.publishedAt).toBeNull();
      });
    });

    describe('Sentiment Handling', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
      });

      it('should save review with sentiment and sentimentScore', async () => {
        const dtoWithSentiment: RecordReviewDto = {
          ...validDto,
          sentiment: 'POSITIVE',
          sentimentScore: 0.85,
        };
        const reviewWithSentiment = {
          ...mockReview,
          sentiment: 'POSITIVE',
          sentimentScore: 0.85,
        };
        mockReviewRepository.save.mockResolvedValue(reviewWithSentiment);

        const result = await useCase.execute(dtoWithSentiment);

        expect(result.sentiment).toBe('POSITIVE');
        expect(result.sentimentScore).toBe(0.85);
      });

      it('should handle NEGATIVE sentiment', async () => {
        const dtoWithNegativeSentiment: RecordReviewDto = {
          ...validDto,
          sentiment: 'NEGATIVE',
          sentimentScore: -0.75,
        };
        const reviewWithNegativeSentiment = {
          ...mockReview,
          sentiment: 'NEGATIVE',
          sentimentScore: -0.75,
        };
        mockReviewRepository.save.mockResolvedValue(reviewWithNegativeSentiment);

        const result = await useCase.execute(dtoWithNegativeSentiment);

        expect(result.sentiment).toBe('NEGATIVE');
        expect(result.sentimentScore).toBe(-0.75);
      });

      it('should handle NEUTRAL sentiment', async () => {
        const dtoWithNeutralSentiment: RecordReviewDto = {
          ...validDto,
          sentiment: 'NEUTRAL',
          sentimentScore: 0.05, // Small non-zero value for NEUTRAL
        };
        const reviewWithNeutralSentiment = {
          ...mockReview,
          sentiment: 'NEUTRAL',
          sentimentScore: 0.05,
        };
        mockReviewRepository.save.mockResolvedValue(reviewWithNeutralSentiment);

        const result = await useCase.execute(dtoWithNeutralSentiment);

        expect(result.sentiment).toBe('NEUTRAL');
        expect(result.sentimentScore).toBe(0.05);
      });
    });

    describe('Review Types', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        mockReviewRepository.save.mockResolvedValue(mockReview);
      });

      it('should handle BLOG review type', async () => {
        const dtoWithBlog: RecordReviewDto = {
          ...validDto,
          reviewType: 'BLOG',
        };

        await useCase.execute(dtoWithBlog);

        expect(mockReviewRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            reviewType: 'BLOG',
          })
        );
      });

      it('should handle VISITOR review type', async () => {
        const dtoWithVisitor: RecordReviewDto = {
          ...validDto,
          reviewType: 'VISITOR',
        };

        await useCase.execute(dtoWithVisitor);

        expect(mockReviewRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            reviewType: 'VISITOR',
          })
        );
      });

      it('should handle OTHER review type', async () => {
        const dtoWithOther: RecordReviewDto = {
          ...validDto,
          reviewType: 'OTHER',
        };

        await useCase.execute(dtoWithOther);

        expect(mockReviewRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            reviewType: 'OTHER',
          })
        );
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        mockReviewRepository.save.mockResolvedValue(mockReview);
      });

      it('should validate Place before checking duplicate', async () => {
        await useCase.execute(validDto);

        const findPlaceCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const checkDuplicateCall =
          mockReviewRepository.findByNaverReviewId.mock.invocationCallOrder[0];

        expect(findPlaceCall).toBeLessThan(checkDuplicateCall);
      });

      it('should check duplicate before saving', async () => {
        await useCase.execute(validDto);

        const checkDuplicateCall =
          mockReviewRepository.findByNaverReviewId.mock.invocationCallOrder[0];
        const saveCall = mockReviewRepository.save.mock.invocationCallOrder[0];

        expect(checkDuplicateCall).toBeLessThan(saveCall);
      });

      it('should not check duplicate if Place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockReviewRepository.findByNaverReviewId).not.toHaveBeenCalled();
      });

      it('should not save if duplicate exists', async () => {
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(mockReview);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockReviewRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewRepository.findByNaverReviewId.mockResolvedValue(null);
        mockReviewRepository.save.mockResolvedValue(mockReview);
      });

      it('should handle minimum rating (1)', async () => {
        const dtoWithMinRating: RecordReviewDto = {
          ...validDto,
          rating: 1,
        };

        await useCase.execute(dtoWithMinRating);

        expect(mockReviewRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            rating: 1,
          })
        );
      });

      it('should handle maximum rating (5)', async () => {
        const dtoWithMaxRating: RecordReviewDto = {
          ...validDto,
          rating: 5,
        };

        await useCase.execute(dtoWithMaxRating);

        expect(mockReviewRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            rating: 5,
          })
        );
      });

      it('should handle different Place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        const dtoWithUuid: RecordReviewDto = {
          ...validDto,
          placeId: uuidPlaceId,
        };

        await useCase.execute(dtoWithUuid);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
      });
    });
  });
});
