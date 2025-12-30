import { RecordRankingUseCase } from '@application/usecases/tracking/ranking/RecordRankingUseCase';
import { RecordRankingDto } from '@application/dtos/tracking/ranking/RecordRankingDto';
import { IRankingHistoryRepository } from '@domain/repositories/IRankingHistoryRepository';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { RankingHistory } from '@domain/entities/RankingHistory';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { User } from '@domain/entities/User';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('RecordRankingUseCase', () => {
  let useCase: RecordRankingUseCase;
  let mockRankingHistoryRepository: jest.Mocked<IRankingHistoryRepository>;
  let mockPlaceKeywordRepository: jest.Mocked<IPlaceKeywordRepository>;

  beforeEach(() => {
    mockRankingHistoryRepository = MockFactory.createRankingHistoryRepository();
    mockPlaceKeywordRepository = MockFactory.createPlaceKeywordRepository();
    useCase = new RecordRankingUseCase(mockRankingHistoryRepository, mockPlaceKeywordRepository);
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

    const mockKeyword: Keyword = {
      id: 'keyword-123',
      keyword: '강남 맛집',
      createdAt: new Date(),
      placeKeywords: [],
    };

    const mockPlaceKeyword: PlaceKeyword = {
      id: 'pk-123',
      place: mockPlace,
      keyword: mockKeyword,
      region: '서울 강남구',
      isActive: true,
      createdAt: new Date(),
      rankingHistories: [],
    };

    const validDto: RecordRankingDto = {
      placeKeywordId: 'pk-123',
      rank: 5,
      searchResultCount: 100,
      checkedAt: new Date(),
    };

    const mockRankingHistory: RankingHistory = {
      id: 'rh-123',
      placeKeyword: mockPlaceKeyword,
      rank: 5,
      searchResultCount: 100,
      checkedAt: new Date(),
      createdAt: new Date(),
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockRankingHistoryRepository.save.mockResolvedValue(mockRankingHistory);
      });

      it('should successfully record ranking with valid data', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.id).toBe(mockRankingHistory.id);
        expect(result.placeKeywordId).toBe(mockPlaceKeyword.id);
        expect(result.rank).toBe(validDto.rank);
        expect(result.searchResultCount).toBe(validDto.searchResultCount);
        expect(result.checkedAt).toEqual(validDto.checkedAt);
      });

      it('should validate PlaceKeyword exists', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(validDto.placeKeywordId);
      });

      it('should save RankingHistory with correct data', async () => {
        await useCase.execute(validDto);

        expect(mockRankingHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            placeKeyword: mockPlaceKeyword,
            rank: validDto.rank,
            searchResultCount: validDto.searchResultCount,
            checkedAt: validDto.checkedAt,
          })
        );
      });

      it('should return RankingHistoryResponseDto', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('placeKeywordId');
        expect(result).toHaveProperty('rank');
        expect(result).toHaveProperty('searchResultCount');
        expect(result).toHaveProperty('checkedAt');
        expect(result).toHaveProperty('createdAt');
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when PlaceKeyword does not exist', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `PlaceKeyword with id ${validDto.placeKeywordId} not found`
        );
      });

      it('should throw BadRequestError when PlaceKeyword is inactive', async () => {
        const inactivePlaceKeyword = { ...mockPlaceKeyword, isActive: false };
        mockPlaceKeywordRepository.findById.mockResolvedValue(inactivePlaceKeyword);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Cannot record ranking for inactive PlaceKeyword ${validDto.placeKeywordId}`
        );
      });

      it('should propagate repository errors when finding PlaceKeyword', async () => {
        const error = new Error('Database connection failed');
        mockPlaceKeywordRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when saving RankingHistory', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        const error = new Error('Failed to save ranking history');
        mockRankingHistoryRepository.save.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Null Rank Handling', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should handle null rank (not found in search results)', async () => {
        const dtoWithNullRank: RecordRankingDto = {
          ...validDto,
          rank: null,
        };
        const historyWithNullRank = { ...mockRankingHistory, rank: null };
        mockRankingHistoryRepository.save.mockResolvedValue(historyWithNullRank);

        const result = await useCase.execute(dtoWithNullRank);

        expect(result.rank).toBeNull();
        expect(mockRankingHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            rank: null,
          })
        );
      });

      it('should handle null searchResultCount', async () => {
        const dtoWithNullCount: RecordRankingDto = {
          ...validDto,
          searchResultCount: null,
        };
        const historyWithNullCount = { ...mockRankingHistory, searchResultCount: null };
        mockRankingHistoryRepository.save.mockResolvedValue(historyWithNullCount);

        const result = await useCase.execute(dtoWithNullCount);

        expect(result.searchResultCount).toBeNull();
      });

      it('should handle both rank and searchResultCount as null', async () => {
        const dtoWithNulls: RecordRankingDto = {
          ...validDto,
          rank: null,
          searchResultCount: null,
        };
        const historyWithNulls = {
          ...mockRankingHistory,
          rank: null,
          searchResultCount: null,
        };
        mockRankingHistoryRepository.save.mockResolvedValue(historyWithNulls);

        const result = await useCase.execute(dtoWithNulls);

        expect(result.rank).toBeNull();
        expect(result.searchResultCount).toBeNull();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockRankingHistoryRepository.save.mockResolvedValue(mockRankingHistory);
      });

      it('should handle rank 1 (top ranking)', async () => {
        const dtoWithRank1: RecordRankingDto = {
          ...validDto,
          rank: 1,
        };
        const historyWithRank1 = { ...mockRankingHistory, rank: 1 };
        mockRankingHistoryRepository.save.mockResolvedValue(historyWithRank1);

        const result = await useCase.execute(dtoWithRank1);

        expect(result.rank).toBe(1);
      });

      it('should handle very high rank', async () => {
        const dtoWithHighRank: RecordRankingDto = {
          ...validDto,
          rank: 9999,
        };
        const historyWithHighRank = { ...mockRankingHistory, rank: 9999 };
        mockRankingHistoryRepository.save.mockResolvedValue(historyWithHighRank);

        const result = await useCase.execute(dtoWithHighRank);

        expect(result.rank).toBe(9999);
      });

      it('should handle zero searchResultCount', async () => {
        const dtoWithZeroCount: RecordRankingDto = {
          ...validDto,
          searchResultCount: 0,
        };
        const historyWithZeroCount = { ...mockRankingHistory, searchResultCount: 0 };
        mockRankingHistoryRepository.save.mockResolvedValue(historyWithZeroCount);

        const result = await useCase.execute(dtoWithZeroCount);

        expect(result.searchResultCount).toBe(0);
      });

      it('should handle different PlaceKeyword ID formats', async () => {
        const uuidPlaceKeywordId = '550e8400-e29b-41d4-a716-446655440000';
        const dtoWithUuid: RecordRankingDto = {
          ...validDto,
          placeKeywordId: uuidPlaceKeywordId,
        };

        await useCase.execute(dtoWithUuid);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(uuidPlaceKeywordId);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockRankingHistoryRepository.save.mockResolvedValue(mockRankingHistory);
      });

      it('should validate PlaceKeyword before saving RankingHistory', async () => {
        await useCase.execute(validDto);

        const findCall = mockPlaceKeywordRepository.findById.mock.invocationCallOrder[0];
        const saveCall = mockRankingHistoryRepository.save.mock.invocationCallOrder[0];

        expect(findCall).toBeLessThan(saveCall);
      });

      it('should not save RankingHistory if PlaceKeyword not found', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockRankingHistoryRepository.save).not.toHaveBeenCalled();
      });

      it('should not save RankingHistory if PlaceKeyword is inactive', async () => {
        const inactivePlaceKeyword = { ...mockPlaceKeyword, isActive: false };
        mockPlaceKeywordRepository.findById.mockResolvedValue(inactivePlaceKeyword);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockRankingHistoryRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('PlaceKeyword Active Status', () => {
      it('should allow recording for active PlaceKeyword', async () => {
        const activePlaceKeyword = { ...mockPlaceKeyword, isActive: true };
        mockPlaceKeywordRepository.findById.mockResolvedValue(activePlaceKeyword);
        mockRankingHistoryRepository.save.mockResolvedValue(mockRankingHistory);

        await expect(useCase.execute(validDto)).resolves.not.toThrow();
      });

      it('should reject recording for inactive PlaceKeyword', async () => {
        const inactivePlaceKeyword = { ...mockPlaceKeyword, isActive: false };
        mockPlaceKeywordRepository.findById.mockResolvedValue(inactivePlaceKeyword);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
      });
    });
  });
});
