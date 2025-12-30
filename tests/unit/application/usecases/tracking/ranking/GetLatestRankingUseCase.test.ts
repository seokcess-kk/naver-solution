import { GetLatestRankingUseCase } from '@application/usecases/tracking/ranking/GetLatestRankingUseCase';
import { IRankingHistoryRepository } from '@domain/repositories/IRankingHistoryRepository';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { RankingHistory } from '@domain/entities/RankingHistory';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { User } from '@domain/entities/User';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetLatestRankingUseCase', () => {
  let useCase: GetLatestRankingUseCase;
  let mockRankingHistoryRepository: jest.Mocked<IRankingHistoryRepository>;
  let mockPlaceKeywordRepository: jest.Mocked<IPlaceKeywordRepository>;

  beforeEach(() => {
    mockRankingHistoryRepository = MockFactory.createRankingHistoryRepository();
    mockPlaceKeywordRepository = MockFactory.createPlaceKeywordRepository();
    useCase = new GetLatestRankingUseCase(mockRankingHistoryRepository, mockPlaceKeywordRepository);
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

    const mockRankingHistory: RankingHistory = {
      id: 'rh-123',
      placeKeyword: mockPlaceKeyword,
      rank: 5,
      searchResultCount: 100,
      checkedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(
          mockRankingHistory
        );
      });

      it('should return latest ranking for valid PlaceKeyword', async () => {
        const result = await useCase.execute(placeKeywordId);

        expect(result).toBeDefined();
        expect(result!.id).toBe(mockRankingHistory.id);
        expect(result!.placeKeywordId).toBe(placeKeywordId);
        expect(result!.rank).toBe(mockRankingHistory.rank);
        expect(result!.searchResultCount).toBe(mockRankingHistory.searchResultCount);
        expect(result!.checkedAt).toEqual(mockRankingHistory.checkedAt);
      });

      it('should validate PlaceKeyword exists', async () => {
        await useCase.execute(placeKeywordId);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(placeKeywordId);
      });

      it('should call repository with correct PlaceKeyword ID', async () => {
        await useCase.execute(placeKeywordId);

        expect(mockRankingHistoryRepository.findLatestByPlaceKeywordId).toHaveBeenCalledWith(
          placeKeywordId
        );
      });

      it('should include relations in response', async () => {
        const result = await useCase.execute(placeKeywordId);

        expect(result).toHaveProperty('placeName', mockPlace.name);
        expect(result).toHaveProperty('keywordText', mockKeyword.keyword);
        expect(result).toHaveProperty('region', mockPlaceKeyword.region);
      });

      it('should return RankingHistoryResponseDto', async () => {
        const result = await useCase.execute(placeKeywordId);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('placeKeywordId');
        expect(result).toHaveProperty('rank');
        expect(result).toHaveProperty('searchResultCount');
        expect(result).toHaveProperty('checkedAt');
        expect(result).toHaveProperty('createdAt');
      });
    });

    describe('No History Cases', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should return null when no history exists', async () => {
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(null);

        const result = await useCase.execute(placeKeywordId);

        expect(result).toBeNull();
      });

      it('should call repository even when no history exists', async () => {
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(null);

        await useCase.execute(placeKeywordId);

        expect(mockRankingHistoryRepository.findLatestByPlaceKeywordId).toHaveBeenCalledWith(
          placeKeywordId
        );
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when PlaceKeyword does not exist', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(placeKeywordId)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(placeKeywordId)).rejects.toThrow(
          `PlaceKeyword with id ${placeKeywordId} not found`
        );
      });

      it('should propagate repository errors when finding PlaceKeyword', async () => {
        const error = new Error('Database connection failed');
        mockPlaceKeywordRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(placeKeywordId)).rejects.toThrow(error);
      });

      it('should propagate repository errors when finding latest ranking', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        const error = new Error('Failed to fetch latest ranking');
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockRejectedValue(error);

        await expect(useCase.execute(placeKeywordId)).rejects.toThrow(error);
      });
    });

    describe('Null Rank Handling', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should handle ranking with null rank (not found)', async () => {
        const historyWithNullRank = { ...mockRankingHistory, rank: null };
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(
          historyWithNullRank
        );

        const result = await useCase.execute(placeKeywordId);

        expect(result!.rank).toBeNull();
      });

      it('should handle ranking with null searchResultCount', async () => {
        const historyWithNullCount = { ...mockRankingHistory, searchResultCount: null };
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(
          historyWithNullCount
        );

        const result = await useCase.execute(placeKeywordId);

        expect(result!.searchResultCount).toBeNull();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(
          mockRankingHistory
        );
      });

      it('should handle different PlaceKeyword ID formats', async () => {
        const uuidPlaceKeywordId = '550e8400-e29b-41d4-a716-446655440000';
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);

        await useCase.execute(uuidPlaceKeywordId);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(uuidPlaceKeywordId);
      });

      it('should handle ranking with rank 1 (top position)', async () => {
        const historyWithRank1 = { ...mockRankingHistory, rank: 1 };
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(historyWithRank1);

        const result = await useCase.execute(placeKeywordId);

        expect(result!.rank).toBe(1);
      });

      it('should handle very high rank', async () => {
        const historyWithHighRank = { ...mockRankingHistory, rank: 9999 };
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(
          historyWithHighRank
        );

        const result = await useCase.execute(placeKeywordId);

        expect(result!.rank).toBe(9999);
      });

      it('should handle PlaceKeyword with null region', async () => {
        const placeKeywordWithNullRegion = { ...mockPlaceKeyword, region: null };
        mockPlaceKeywordRepository.findById.mockResolvedValueOnce(placeKeywordWithNullRegion);
        const historyWithNullRegion = {
          ...mockRankingHistory,
          placeKeyword: placeKeywordWithNullRegion,
        };
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValueOnce(
          historyWithNullRegion
        );

        const result = await useCase.execute(placeKeywordId);

        expect(result!.region).toBeNull();
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(
          mockRankingHistory
        );
      });

      it('should validate PlaceKeyword before fetching ranking', async () => {
        await useCase.execute(placeKeywordId);

        const findPlaceKeywordCall = mockPlaceKeywordRepository.findById.mock.invocationCallOrder[0];
        const findRankingCall =
          mockRankingHistoryRepository.findLatestByPlaceKeywordId.mock.invocationCallOrder[0];

        expect(findPlaceKeywordCall).toBeLessThan(findRankingCall);
      });

      it('should not fetch ranking if PlaceKeyword not found', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(placeKeywordId)).rejects.toThrow();

        expect(mockRankingHistoryRepository.findLatestByPlaceKeywordId).not.toHaveBeenCalled();
      });
    });

    describe('Inactive PlaceKeyword', () => {
      it('should return latest ranking even for inactive PlaceKeyword', async () => {
        const inactivePlaceKeyword = { ...mockPlaceKeyword, isActive: false };
        mockPlaceKeywordRepository.findById.mockResolvedValue(inactivePlaceKeyword);
        mockRankingHistoryRepository.findLatestByPlaceKeywordId.mockResolvedValue(
          mockRankingHistory
        );

        const result = await useCase.execute(placeKeywordId);

        expect(result).toBeDefined();
        expect(result!.id).toBe(mockRankingHistory.id);
      });
    });
  });
});
