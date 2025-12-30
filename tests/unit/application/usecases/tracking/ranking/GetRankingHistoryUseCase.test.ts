import { GetRankingHistoryUseCase } from '@application/usecases/tracking/ranking/GetRankingHistoryUseCase';
import { GetRankingHistoryDto } from '@application/dtos/tracking/ranking/GetRankingHistoryDto';
import { IRankingHistoryRepository } from '@domain/repositories/IRankingHistoryRepository';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { RankingHistory } from '@domain/entities/RankingHistory';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetRankingHistoryUseCase', () => {
  let useCase: GetRankingHistoryUseCase;
  let mockRankingHistoryRepository: jest.Mocked<IRankingHistoryRepository>;
  let mockPlaceKeywordRepository: jest.Mocked<IPlaceKeywordRepository>;

  beforeEach(() => {
    mockRankingHistoryRepository = MockFactory.createRankingHistoryRepository();
    mockPlaceKeywordRepository = MockFactory.createPlaceKeywordRepository();
    useCase = new GetRankingHistoryUseCase(mockRankingHistoryRepository, mockPlaceKeywordRepository);
  });

  describe('execute', () => {
    const placeKeywordId = 'pk-123';

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

    const mockKeyword: Keyword = {
      id: 'keyword-123',
      keyword: '강남 맛집',
      createdAt: new Date(),
      placeKeywords: [],
    };

    const mockPlaceKeyword: PlaceKeyword = {
      id: placeKeywordId,
      place: mockPlace,
      keyword: mockKeyword,
      region: '서울 강남구',
      isActive: true,
      createdAt: new Date(),
      rankingHistories: [],
    };

    const createMockHistory = (id: string, rank: number, checkedAt: Date): RankingHistory => ({
      id,
      placeKeyword: mockPlaceKeyword,
      rank,
      searchResultCount: 100,
      checkedAt,
      createdAt: checkedAt,
    });

    const mockHistories: RankingHistory[] = [
      createMockHistory('rh-1', 5, new Date('2024-01-01')),
      createMockHistory('rh-2', 3, new Date('2024-01-02')),
      createMockHistory('rh-3', 7, new Date('2024-01-03')),
    ];

    describe('Happy Path - Date Range', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should return histories within date range', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-03'),
        };
        mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange.mockResolvedValue(
          mockHistories
        );

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(3);
        expect(result[0].id).toBe('rh-1');
        expect(result[1].id).toBe('rh-2');
        expect(result[2].id).toBe('rh-3');
      });

      it('should call repository with correct date range parameters', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        };
        mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange).toHaveBeenCalledWith(
          placeKeywordId,
          dto.startDate,
          dto.endDate
        );
      });

      it('should include relations in response DTOs', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-03'),
        };
        mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange.mockResolvedValue(
          mockHistories
        );

        const result = await useCase.execute(dto);

        expect(result[0]).toHaveProperty('placeName', mockPlace.name);
        expect(result[0]).toHaveProperty('keywordText', mockKeyword.keyword);
        expect(result[0]).toHaveProperty('region', mockPlaceKeyword.region);
      });
    });

    describe('Happy Path - Limit Based', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should return histories with custom limit', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          limit: 50,
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue(mockHistories);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(3);
        expect(mockRankingHistoryRepository.findByPlaceKeywordId).toHaveBeenCalledWith(
          placeKeywordId,
          50
        );
      });

      it('should use default limit of 100 when not provided', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue(mockHistories);

        await useCase.execute(dto);

        expect(mockRankingHistoryRepository.findByPlaceKeywordId).toHaveBeenCalledWith(
          placeKeywordId,
          100
        );
      });

      it('should return empty array when no histories exist', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue([]);

        const result = await useCase.execute(dto);

        expect(result).toEqual([]);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when PlaceKeyword does not exist', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
        };

        await expect(useCase.execute(dto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(dto)).rejects.toThrow(
          `PlaceKeyword with id ${placeKeywordId} not found`
        );
      });

      it('should propagate repository errors when finding PlaceKeyword', async () => {
        const error = new Error('Database connection failed');
        mockPlaceKeywordRepository.findById.mockRejectedValue(error);
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
        };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding histories by date range', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        const error = new Error('Failed to fetch histories');
        mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange.mockRejectedValue(error);
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding histories by limit', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        const error = new Error('Failed to fetch histories');
        mockRankingHistoryRepository.findByPlaceKeywordId.mockRejectedValue(error);
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
        };

        await expect(useCase.execute(dto)).rejects.toThrow(error);
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should handle limit of 1', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          limit: 1,
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue([mockHistories[0]]);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1);
        expect(mockRankingHistoryRepository.findByPlaceKeywordId).toHaveBeenCalledWith(
          placeKeywordId,
          1
        );
      });

      it('should handle limit of 1000 (maximum)', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          limit: 1000,
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue(mockHistories);

        await useCase.execute(dto);

        expect(mockRankingHistoryRepository.findByPlaceKeywordId).toHaveBeenCalledWith(
          placeKeywordId,
          1000
        );
      });

      it('should handle same start and end date', async () => {
        const sameDate = new Date('2024-01-01');
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          startDate: sameDate,
          endDate: sameDate,
        };
        mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange.mockResolvedValue([
          mockHistories[0],
        ]);

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(1);
      });

      it('should handle very wide date range', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2030-12-31'),
        };
        mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange.mockResolvedValue(
          mockHistories
        );

        const result = await useCase.execute(dto);

        expect(result).toHaveLength(3);
      });

      it('should handle different PlaceKeyword ID formats', async () => {
        const uuidPlaceKeywordId = '550e8400-e29b-41d4-a716-446655440000';
        const dto: GetRankingHistoryDto = {
          placeKeywordId: uuidPlaceKeywordId,
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(uuidPlaceKeywordId);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should validate PlaceKeyword before fetching histories by date range', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        };
        mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange.mockResolvedValue([]);

        await useCase.execute(dto);

        const findPlaceKeywordCall = mockPlaceKeywordRepository.findById.mock.invocationCallOrder[0];
        const findHistoriesCall =
          mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange.mock.invocationCallOrder[0];

        expect(findPlaceKeywordCall).toBeLessThan(findHistoriesCall);
      });

      it('should validate PlaceKeyword before fetching histories by limit', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue([]);

        await useCase.execute(dto);

        const findPlaceKeywordCall = mockPlaceKeywordRepository.findById.mock.invocationCallOrder[0];
        const findHistoriesCall =
          mockRankingHistoryRepository.findByPlaceKeywordId.mock.invocationCallOrder[0];

        expect(findPlaceKeywordCall).toBeLessThan(findHistoriesCall);
      });

      it('should not fetch histories if PlaceKeyword not found', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
        };

        await expect(useCase.execute(dto)).rejects.toThrow();

        expect(mockRankingHistoryRepository.findByPlaceKeywordId).not.toHaveBeenCalled();
        expect(
          mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange
        ).not.toHaveBeenCalled();
      });
    });

    describe('Date Range vs Limit Selection', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should use date range method when both dates provided', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-10'),
        };
        mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange).toHaveBeenCalled();
        expect(mockRankingHistoryRepository.findByPlaceKeywordId).not.toHaveBeenCalled();
      });

      it('should use limit method when dates not provided', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          limit: 50,
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockRankingHistoryRepository.findByPlaceKeywordId).toHaveBeenCalled();
        expect(mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange).not.toHaveBeenCalled();
      });

      it('should use limit method when only startDate provided', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          startDate: new Date('2024-01-01'),
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockRankingHistoryRepository.findByPlaceKeywordId).toHaveBeenCalled();
        expect(mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange).not.toHaveBeenCalled();
      });

      it('should use limit method when only endDate provided', async () => {
        const dto: GetRankingHistoryDto = {
          placeKeywordId,
          endDate: new Date('2024-01-10'),
        };
        mockRankingHistoryRepository.findByPlaceKeywordId.mockResolvedValue([]);

        await useCase.execute(dto);

        expect(mockRankingHistoryRepository.findByPlaceKeywordId).toHaveBeenCalled();
        expect(mockRankingHistoryRepository.findByPlaceKeywordIdInDateRange).not.toHaveBeenCalled();
      });
    });
  });
});
