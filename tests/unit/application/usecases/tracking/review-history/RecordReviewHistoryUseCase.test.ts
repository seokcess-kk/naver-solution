import { RecordReviewHistoryUseCase } from '@application/usecases/tracking/review-history/RecordReviewHistoryUseCase';
import { RecordReviewHistoryDto } from '@application/dtos/tracking/review-history/RecordReviewHistoryDto';
import { IReviewHistoryRepository } from '@domain/repositories/IReviewHistoryRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { ReviewHistory } from '@domain/entities/ReviewHistory';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('RecordReviewHistoryUseCase', () => {
  let useCase: RecordReviewHistoryUseCase;
  let mockReviewHistoryRepository: jest.Mocked<IReviewHistoryRepository>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockReviewHistoryRepository = MockFactory.createReviewHistoryRepository();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new RecordReviewHistoryUseCase(mockReviewHistoryRepository, mockPlaceRepository);
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

    const validDto: RecordReviewHistoryDto = {
      placeId: 'place-123',
      blogReviewCount: 15,
      visitorReviewCount: 32,
      averageRating: 4.5,
      checkedAt: new Date('2024-01-15'),
    };

    const mockReviewHistory: ReviewHistory = {
      id: 'rh-123',
      place: mockPlace,
      blogReviewCount: 15,
      visitorReviewCount: 32,
      averageRating: 4.5,
      checkedAt: new Date('2024-01-15'),
      createdAt: new Date(),
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.save.mockResolvedValue(mockReviewHistory);
      });

      it('should successfully record review history with valid data', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.id).toBe(mockReviewHistory.id);
        expect(result.placeId).toBe(mockPlace.id);
        expect(result.blogReviewCount).toBe(validDto.blogReviewCount);
        expect(result.visitorReviewCount).toBe(validDto.visitorReviewCount);
        expect(result.averageRating).toBe(validDto.averageRating);
        expect(result.checkedAt).toEqual(validDto.checkedAt);
      });

      it('should validate Place exists', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(validDto.placeId);
      });

      it('should save ReviewHistory with correct data', async () => {
        await useCase.execute(validDto);

        expect(mockReviewHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            place: mockPlace,
            blogReviewCount: validDto.blogReviewCount,
            visitorReviewCount: validDto.visitorReviewCount,
            averageRating: validDto.averageRating,
            checkedAt: validDto.checkedAt,
          })
        );
      });

      it('should return ReviewHistoryResponseDto with computed fields', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('placeId');
        expect(result).toHaveProperty('blogReviewCount');
        expect(result).toHaveProperty('visitorReviewCount');
        expect(result).toHaveProperty('averageRating');
        expect(result).toHaveProperty('checkedAt');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('totalReviewCount');
      });

      it('should calculate totalReviewCount correctly', async () => {
        const result = await useCase.execute(validDto);

        expect(result.totalReviewCount).toBe(
          validDto.blogReviewCount + validDto.visitorReviewCount
        );
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

      it('should throw BadRequestError when Place is inactive', async () => {
        const inactivePlace = { ...mockPlace, isActive: false };
        mockPlaceRepository.findById.mockResolvedValue(inactivePlace);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Cannot record review history for inactive Place ${validDto.placeId}`
        );
      });
    });

    describe('Error Cases - Repository Errors', () => {
      it('should propagate repository errors when finding Place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when saving ReviewHistory', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to save review history');
        mockReviewHistoryRepository.save.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Optional Fields', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should handle review history without averageRating', async () => {
        const dtoWithoutRating: RecordReviewHistoryDto = {
          ...validDto,
          averageRating: null,
        };
        const historyWithoutRating = { ...mockReviewHistory, averageRating: null };
        mockReviewHistoryRepository.save.mockResolvedValue(historyWithoutRating);

        const result = await useCase.execute(dtoWithoutRating);

        expect(result.averageRating).toBeNull();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.save.mockResolvedValue(mockReviewHistory);
      });

      it('should handle zero blog review count', async () => {
        const dtoWithZeroBlog: RecordReviewHistoryDto = {
          ...validDto,
          blogReviewCount: 0,
        };

        await useCase.execute(dtoWithZeroBlog);

        expect(mockReviewHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            blogReviewCount: 0,
          })
        );
      });

      it('should handle zero visitor review count', async () => {
        const dtoWithZeroVisitor: RecordReviewHistoryDto = {
          ...validDto,
          visitorReviewCount: 0,
        };

        await useCase.execute(dtoWithZeroVisitor);

        expect(mockReviewHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            visitorReviewCount: 0,
          })
        );
      });

      it('should handle minimum rating (0)', async () => {
        const dtoWithMinRating: RecordReviewHistoryDto = {
          ...validDto,
          averageRating: 0,
        };

        await useCase.execute(dtoWithMinRating);

        expect(mockReviewHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            averageRating: 0,
          })
        );
      });

      it('should handle maximum rating (5)', async () => {
        const dtoWithMaxRating: RecordReviewHistoryDto = {
          ...validDto,
          averageRating: 5,
        };

        await useCase.execute(dtoWithMaxRating);

        expect(mockReviewHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            averageRating: 5,
          })
        );
      });

      it('should handle large review counts', async () => {
        const dtoWithLargeCounts: RecordReviewHistoryDto = {
          ...validDto,
          blogReviewCount: 9999,
          visitorReviewCount: 8888,
        };

        await useCase.execute(dtoWithLargeCounts);

        expect(mockReviewHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            blogReviewCount: 9999,
            visitorReviewCount: 8888,
          })
        );
      });

      it('should handle different Place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        const dtoWithUuid: RecordReviewHistoryDto = {
          ...validDto,
          placeId: uuidPlaceId,
        };

        await useCase.execute(dtoWithUuid);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.save.mockResolvedValue(mockReviewHistory);
      });

      it('should validate Place before saving', async () => {
        await useCase.execute(validDto);

        const findPlaceCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const saveCall = mockReviewHistoryRepository.save.mock.invocationCallOrder[0];

        expect(findPlaceCall).toBeLessThan(saveCall);
      });

      it('should not save if Place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockReviewHistoryRepository.save).not.toHaveBeenCalled();
      });

      it('should not save if Place is inactive', async () => {
        const inactivePlace = { ...mockPlace, isActive: false };
        mockPlaceRepository.findById.mockResolvedValue(inactivePlace);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockReviewHistoryRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('Different Data Scenarios', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.save.mockResolvedValue(mockReviewHistory);
      });

      it('should handle only blog reviews', async () => {
        const dtoOnlyBlog: RecordReviewHistoryDto = {
          ...validDto,
          blogReviewCount: 50,
          visitorReviewCount: 0,
        };

        await useCase.execute(dtoOnlyBlog);

        expect(mockReviewHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            blogReviewCount: 50,
            visitorReviewCount: 0,
          })
        );
      });

      it('should handle only visitor reviews', async () => {
        const dtoOnlyVisitor: RecordReviewHistoryDto = {
          ...validDto,
          blogReviewCount: 0,
          visitorReviewCount: 100,
        };

        await useCase.execute(dtoOnlyVisitor);

        expect(mockReviewHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            blogReviewCount: 0,
            visitorReviewCount: 100,
          })
        );
      });

      it('should handle decimal average rating', async () => {
        const dtoWithDecimalRating: RecordReviewHistoryDto = {
          ...validDto,
          averageRating: 4.7,
        };

        await useCase.execute(dtoWithDecimalRating);

        expect(mockReviewHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            averageRating: 4.7,
          })
        );
      });
    });

    describe('Response DTO Mapping', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.save.mockResolvedValue(mockReviewHistory);
      });

      it('should include all ReviewHistory fields in response', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('placeId');
        expect(result).toHaveProperty('blogReviewCount');
        expect(result).toHaveProperty('visitorReviewCount');
        expect(result).toHaveProperty('averageRating');
        expect(result).toHaveProperty('checkedAt');
        expect(result).toHaveProperty('createdAt');
      });

      it('should map placeId correctly', async () => {
        const result = await useCase.execute(validDto);

        expect(result.placeId).toBe(mockPlace.id);
      });

      it('should include totalReviewCount when computed fields enabled', async () => {
        const result = await useCase.execute(validDto);

        expect(result.totalReviewCount).toBeDefined();
        expect(result.totalReviewCount).toBe(47); // 15 + 32
      });
    });
  });
});
