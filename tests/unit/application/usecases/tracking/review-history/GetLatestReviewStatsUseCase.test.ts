import { GetLatestReviewStatsUseCase } from '@application/usecases/tracking/review-history/GetLatestReviewStatsUseCase';
import { IReviewHistoryRepository } from '@domain/repositories/IReviewHistoryRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { ReviewHistory } from '@domain/entities/ReviewHistory';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetLatestReviewStatsUseCase', () => {
  let useCase: GetLatestReviewStatsUseCase;
  let mockReviewHistoryRepository: jest.Mocked<IReviewHistoryRepository>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockReviewHistoryRepository = MockFactory.createReviewHistoryRepository();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new GetLatestReviewStatsUseCase(mockReviewHistoryRepository, mockPlaceRepository);
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

    const mockReviewHistory: ReviewHistory = {
      id: 'rh-123',
      place: mockPlace,
      blogReviewCount: 15,
      visitorReviewCount: 32,
      averageRating: 4.5,
      checkedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(mockReviewHistory);
      });

      it('should return latest review stats for valid Place', async () => {
        const result = await useCase.execute(placeId);

        expect(result).toBeDefined();
        expect(result!.id).toBe(mockReviewHistory.id);
        expect(result!.placeId).toBe(placeId);
        expect(result!.blogReviewCount).toBe(mockReviewHistory.blogReviewCount);
        expect(result!.visitorReviewCount).toBe(mockReviewHistory.visitorReviewCount);
        expect(result!.averageRating).toBe(mockReviewHistory.averageRating);
        expect(result!.checkedAt).toEqual(mockReviewHistory.checkedAt);
      });

      it('should validate Place exists', async () => {
        await useCase.execute(placeId);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(placeId);
      });

      it('should call repository with correct Place ID', async () => {
        await useCase.execute(placeId);

        expect(mockReviewHistoryRepository.findLatestByPlaceId).toHaveBeenCalledWith(placeId);
      });

      it('should return ReviewHistoryResponseDto', async () => {
        const result = await useCase.execute(placeId);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('placeId');
        expect(result).toHaveProperty('blogReviewCount');
        expect(result).toHaveProperty('visitorReviewCount');
        expect(result).toHaveProperty('averageRating');
        expect(result).toHaveProperty('checkedAt');
        expect(result).toHaveProperty('createdAt');
      });

      it('should include totalReviewCount computed field', async () => {
        const result = await useCase.execute(placeId);

        expect(result).toHaveProperty('totalReviewCount');
        expect(result!.totalReviewCount).toBe(47); // 15 + 32
      });
    });

    describe('No History Cases', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should return null when no history exists', async () => {
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(null);

        const result = await useCase.execute(placeId);

        expect(result).toBeNull();
      });

      it('should call repository even when no history exists', async () => {
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(null);

        await useCase.execute(placeId);

        expect(mockReviewHistoryRepository.findLatestByPlaceId).toHaveBeenCalledWith(placeId);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when Place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(placeId)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(placeId)).rejects.toThrow(
          `Place with id ${placeId} not found`
        );
      });

      it('should propagate repository errors when finding Place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(placeId)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding latest stats', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to fetch latest stats');
        mockReviewHistoryRepository.findLatestByPlaceId.mockRejectedValue(error);

        await expect(useCase.execute(placeId)).rejects.toThrow(error);
      });
    });

    describe('Null Field Handling', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should handle review history with null averageRating', async () => {
        const historyWithNullRating = { ...mockReviewHistory, averageRating: null };
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(historyWithNullRating);

        const result = await useCase.execute(placeId);

        expect(result!.averageRating).toBeNull();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(mockReviewHistory);
      });

      it('should handle different Place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);

        await useCase.execute(uuidPlaceId);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
      });

      it('should handle zero blog review count', async () => {
        const historyWithZeroBlog = { ...mockReviewHistory, blogReviewCount: 0 };
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(historyWithZeroBlog);

        const result = await useCase.execute(placeId);

        expect(result!.blogReviewCount).toBe(0);
        expect(result!.totalReviewCount).toBe(32); // 0 + 32
      });

      it('should handle zero visitor review count', async () => {
        const historyWithZeroVisitor = { ...mockReviewHistory, visitorReviewCount: 0 };
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(historyWithZeroVisitor);

        const result = await useCase.execute(placeId);

        expect(result!.visitorReviewCount).toBe(0);
        expect(result!.totalReviewCount).toBe(15); // 15 + 0
      });

      it('should handle minimum rating (0)', async () => {
        const historyWithMinRating = { ...mockReviewHistory, averageRating: 0 };
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(historyWithMinRating);

        const result = await useCase.execute(placeId);

        expect(result!.averageRating).toBe(0);
      });

      it('should handle maximum rating (5)', async () => {
        const historyWithMaxRating = { ...mockReviewHistory, averageRating: 5 };
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(historyWithMaxRating);

        const result = await useCase.execute(placeId);

        expect(result!.averageRating).toBe(5);
      });

      it('should handle large review counts', async () => {
        const historyWithLargeCounts = {
          ...mockReviewHistory,
          blogReviewCount: 9999,
          visitorReviewCount: 8888,
        };
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(
          historyWithLargeCounts
        );

        const result = await useCase.execute(placeId);

        expect(result!.blogReviewCount).toBe(9999);
        expect(result!.visitorReviewCount).toBe(8888);
        expect(result!.totalReviewCount).toBe(18887); // 9999 + 8888
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(mockReviewHistory);
      });

      it('should validate Place before fetching stats', async () => {
        await useCase.execute(placeId);

        const findPlaceCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const findStatsCall =
          mockReviewHistoryRepository.findLatestByPlaceId.mock.invocationCallOrder[0];

        expect(findPlaceCall).toBeLessThan(findStatsCall);
      });

      it('should not fetch stats if Place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(placeId)).rejects.toThrow();

        expect(mockReviewHistoryRepository.findLatestByPlaceId).not.toHaveBeenCalled();
      });
    });

    describe('Inactive Place', () => {
      it('should return latest stats even for inactive Place', async () => {
        const inactivePlace = { ...mockPlace, isActive: false };
        mockPlaceRepository.findById.mockResolvedValue(inactivePlace);
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(mockReviewHistory);

        const result = await useCase.execute(placeId);

        expect(result).toBeDefined();
        expect(result!.id).toBe(mockReviewHistory.id);
      });
    });

    describe('Different Data Scenarios', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should handle only blog reviews', async () => {
        const historyOnlyBlog = {
          ...mockReviewHistory,
          blogReviewCount: 50,
          visitorReviewCount: 0,
        };
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(historyOnlyBlog);

        const result = await useCase.execute(placeId);

        expect(result!.blogReviewCount).toBe(50);
        expect(result!.visitorReviewCount).toBe(0);
        expect(result!.totalReviewCount).toBe(50);
      });

      it('should handle only visitor reviews', async () => {
        const historyOnlyVisitor = {
          ...mockReviewHistory,
          blogReviewCount: 0,
          visitorReviewCount: 100,
        };
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(historyOnlyVisitor);

        const result = await useCase.execute(placeId);

        expect(result!.blogReviewCount).toBe(0);
        expect(result!.visitorReviewCount).toBe(100);
        expect(result!.totalReviewCount).toBe(100);
      });

      it('should handle decimal average rating', async () => {
        const historyWithDecimal = { ...mockReviewHistory, averageRating: 4.7 };
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(historyWithDecimal);

        const result = await useCase.execute(placeId);

        expect(result!.averageRating).toBe(4.7);
      });
    });

    describe('Response DTO Mapping', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.findLatestByPlaceId.mockResolvedValue(mockReviewHistory);
      });

      it('should include all ReviewHistory fields in response', async () => {
        const result = await useCase.execute(placeId);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('placeId');
        expect(result).toHaveProperty('blogReviewCount');
        expect(result).toHaveProperty('visitorReviewCount');
        expect(result).toHaveProperty('averageRating');
        expect(result).toHaveProperty('checkedAt');
        expect(result).toHaveProperty('createdAt');
      });

      it('should map placeId correctly', async () => {
        const result = await useCase.execute(placeId);

        expect(result!.placeId).toBe(mockPlace.id);
      });

      it('should include totalReviewCount when computed fields enabled', async () => {
        const result = await useCase.execute(placeId);

        expect(result!.totalReviewCount).toBeDefined();
        expect(result!.totalReviewCount).toBe(47); // 15 + 32
      });
    });
  });
});
