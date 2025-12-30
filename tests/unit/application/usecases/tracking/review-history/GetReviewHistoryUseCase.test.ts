import { GetReviewHistoryUseCase } from '@application/usecases/tracking/review-history/GetReviewHistoryUseCase';
import { GetReviewHistoryDto } from '@application/dtos/tracking/review-history/GetReviewHistoryDto';
import { IReviewHistoryRepository } from '@domain/repositories/IReviewHistoryRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { ReviewHistory } from '@domain/entities/ReviewHistory';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetReviewHistoryUseCase', () => {
  let useCase: GetReviewHistoryUseCase;
  let mockReviewHistoryRepository: jest.Mocked<IReviewHistoryRepository>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockReviewHistoryRepository = MockFactory.createReviewHistoryRepository();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new GetReviewHistoryUseCase(mockReviewHistoryRepository, mockPlaceRepository);
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

    const createMockHistory = (
      id: string,
      blogCount: number,
      visitorCount: number,
      checkedAt: Date
    ): ReviewHistory => ({
      id,
      place: mockPlace,
      blogReviewCount: blogCount,
      visitorReviewCount: visitorCount,
      averageRating: 4.5,
      checkedAt,
      createdAt: new Date(),
    });

    const mockHistories: ReviewHistory[] = [
      createMockHistory('rh-1', 10, 20, new Date('2024-01-15')),
      createMockHistory('rh-2', 12, 22, new Date('2024-01-16')),
      createMockHistory('rh-3', 15, 25, new Date('2024-01-17')),
    ];

    describe('Happy Path - Date Range Query', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');

      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.findByPlaceIdInDateRange.mockResolvedValue(mockHistories);
      });

      it('should return histories within date range', async () => {
        const dto: GetReviewHistoryDto = { placeId, startDate, endDate };
        const result = await useCase.execute(dto);

        expect(result).toHaveLength(3);
        expect(result[0].id).toBe('rh-1');
        expect(result[1].id).toBe('rh-2');
        expect(result[2].id).toBe('rh-3');
      });

      it('should call repository with correct date range', async () => {
        const dto: GetReviewHistoryDto = { placeId, startDate, endDate };
        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceIdInDateRange).toHaveBeenCalledWith(
          placeId,
          startDate,
          endDate
        );
      });

      it('should validate Place exists', async () => {
        const dto: GetReviewHistoryDto = { placeId, startDate, endDate };
        await useCase.execute(dto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(placeId);
      });

      it('should not call limit-based query when date range provided', async () => {
        const dto: GetReviewHistoryDto = { placeId, startDate, endDate, limit: 50 };
        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceId).not.toHaveBeenCalled();
      });
    });

    describe('Happy Path - Limit Query', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue(mockHistories);
      });

      it('should return histories with custom limit', async () => {
        const dto: GetReviewHistoryDto = { placeId, limit: 50 };
        const result = await useCase.execute(dto);

        expect(result).toHaveLength(3);
        expect(mockReviewHistoryRepository.findByPlaceId).toHaveBeenCalledWith(placeId, 50);
      });

      it('should use default limit of 100 when not provided', async () => {
        const dto: GetReviewHistoryDto = { placeId };
        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceId).toHaveBeenCalledWith(placeId, 100);
      });

      it('should not call date range query when dates not provided', async () => {
        const dto: GetReviewHistoryDto = { placeId, limit: 50 };
        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceIdInDateRange).not.toHaveBeenCalled();
      });
    });

    describe('Response DTO', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue(mockHistories);
      });

      it('should return ReviewHistoryResponseDto array', async () => {
        const dto: GetReviewHistoryDto = { placeId };
        const result = await useCase.execute(dto);

        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('placeId');
        expect(result[0]).toHaveProperty('blogReviewCount');
        expect(result[0]).toHaveProperty('visitorReviewCount');
        expect(result[0]).toHaveProperty('averageRating');
        expect(result[0]).toHaveProperty('checkedAt');
        expect(result[0]).toHaveProperty('createdAt');
      });

      it('should include totalReviewCount computed field', async () => {
        const dto: GetReviewHistoryDto = { placeId };
        const result = await useCase.execute(dto);

        expect(result[0]).toHaveProperty('totalReviewCount');
        expect(result[0].totalReviewCount).toBe(30); // 10 + 20
        expect(result[1].totalReviewCount).toBe(34); // 12 + 22
        expect(result[2].totalReviewCount).toBe(40); // 15 + 25
      });
    });

    describe('Empty Results', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should return empty array when no histories in date range', async () => {
        const dto: GetReviewHistoryDto = {
          placeId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-14'),
        };
        mockReviewHistoryRepository.findByPlaceIdInDateRange.mockResolvedValue([]);

        const result = await useCase.execute(dto);

        expect(result).toEqual([]);
      });

      it('should return empty array when no histories exist', async () => {
        const dto: GetReviewHistoryDto = { placeId };
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue([]);

        const result = await useCase.execute(dto);

        expect(result).toEqual([]);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when Place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);
        const dto: GetReviewHistoryDto = { placeId };

        await expect(useCase.execute(dto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(dto)).rejects.toThrow(
          `Place with id ${placeId} not found`
        );
      });

      it('should propagate repository errors when finding Place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);
        const dto: GetReviewHistoryDto = { placeId };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding histories by date range', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to fetch histories');
        mockReviewHistoryRepository.findByPlaceIdInDateRange.mockRejectedValue(error);
        const dto: GetReviewHistoryDto = {
          placeId,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-17'),
        };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding histories by limit', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to fetch histories');
        mockReviewHistoryRepository.findByPlaceId.mockRejectedValue(error);
        const dto: GetReviewHistoryDto = { placeId };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });
    });

    describe('Filter Priority', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.findByPlaceIdInDateRange.mockResolvedValue(mockHistories);
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue(mockHistories);
      });

      it('should prefer date range query over limit when both provided', async () => {
        const dto: GetReviewHistoryDto = {
          placeId,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-17'),
          limit: 50,
        };

        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceIdInDateRange).toHaveBeenCalled();
        expect(mockReviewHistoryRepository.findByPlaceId).not.toHaveBeenCalled();
      });

      it('should use limit query when only startDate provided', async () => {
        const dto: GetReviewHistoryDto = {
          placeId,
          startDate: new Date('2024-01-15'),
        };

        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceId).toHaveBeenCalled();
        expect(mockReviewHistoryRepository.findByPlaceIdInDateRange).not.toHaveBeenCalled();
      });

      it('should use limit query when only endDate provided', async () => {
        const dto: GetReviewHistoryDto = {
          placeId,
          endDate: new Date('2024-01-17'),
        };

        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceId).toHaveBeenCalled();
        expect(mockReviewHistoryRepository.findByPlaceIdInDateRange).not.toHaveBeenCalled();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
      });

      it('should handle minimum limit (1)', async () => {
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue([mockHistories[0]]);
        const dto: GetReviewHistoryDto = { placeId, limit: 1 };

        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceId).toHaveBeenCalledWith(placeId, 1);
      });

      it('should handle maximum limit (1000)', async () => {
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue(mockHistories);
        const dto: GetReviewHistoryDto = { placeId, limit: 1000 };

        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceId).toHaveBeenCalledWith(placeId, 1000);
      });

      it('should handle large number of histories', async () => {
        const manyHistories = Array.from({ length: 1000 }, (_, i) =>
          createMockHistory(`rh-${i}`, 10, 20, new Date(`2024-01-${(i % 28) + 1}`))
        );
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue(manyHistories);
        const dto: GetReviewHistoryDto = { placeId };

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1000);
      });

      it('should handle same start and end date', async () => {
        const sameDate = new Date('2024-01-15');
        mockReviewHistoryRepository.findByPlaceIdInDateRange.mockResolvedValue([mockHistories[0]]);
        const dto: GetReviewHistoryDto = { placeId, startDate: sameDate, endDate: sameDate };

        await useCase.execute(dto);

        expect(mockReviewHistoryRepository.findByPlaceIdInDateRange).toHaveBeenCalledWith(
          placeId,
          sameDate,
          sameDate
        );
      });

      it('should handle different Place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue([]);
        const dto: GetReviewHistoryDto = { placeId: uuidPlaceId };

        await useCase.execute(dto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
      });

      it('should handle histories with null averageRating', async () => {
        const historiesWithNullRating = [
          { ...mockHistories[0], averageRating: null },
          { ...mockHistories[1], averageRating: null },
        ];
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue(historiesWithNullRating);
        const dto: GetReviewHistoryDto = { placeId };

        const result = await useCase.execute(dto);

        expect(result[0].averageRating).toBeNull();
        expect(result[1].averageRating).toBeNull();
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue(mockHistories);
      });

      it('should validate Place before fetching histories', async () => {
        const dto: GetReviewHistoryDto = { placeId };
        await useCase.execute(dto);

        const findPlaceCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const findHistoriesCall =
          mockReviewHistoryRepository.findByPlaceId.mock.invocationCallOrder[0];

        expect(findPlaceCall).toBeLessThan(findHistoriesCall);
      });

      it('should not fetch histories if Place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);
        const dto: GetReviewHistoryDto = { placeId };

        await expect(useCase.execute(dto)).rejects.toThrow();

        expect(mockReviewHistoryRepository.findByPlaceId).not.toHaveBeenCalled();
        expect(mockReviewHistoryRepository.findByPlaceIdInDateRange).not.toHaveBeenCalled();
      });
    });

    describe('Inactive Place', () => {
      it('should return histories even for inactive Place', async () => {
        const inactivePlace = { ...mockPlace, isActive: false };
        mockPlaceRepository.findById.mockResolvedValue(inactivePlace);
        mockReviewHistoryRepository.findByPlaceId.mockResolvedValue(mockHistories);
        const dto: GetReviewHistoryDto = { placeId };

        const result = await useCase.execute(dto);

        expect(result).toBeDefined();
        expect(result).toHaveLength(3);
      });
    });
  });
});
