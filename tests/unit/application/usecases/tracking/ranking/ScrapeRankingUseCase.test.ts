import { ScrapeRankingUseCase } from '@application/usecases/tracking/ranking/ScrapeRankingUseCase';
import { RecordRankingUseCase } from '@application/usecases/tracking/ranking/RecordRankingUseCase';
import { ScrapeRankingDto } from '@application/dtos/tracking/ranking/ScrapeRankingDto';
import { INaverScrapingService, NaverRankingResult } from '@infrastructure/naver/interfaces/INaverScrapingService';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { User } from '@domain/entities/User';
import { RankingHistoryResponseDto } from '@application/dtos/tracking/ranking/RankingHistoryResponseDto';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('ScrapeRankingUseCase', () => {
  let useCase: ScrapeRankingUseCase;
  let mockNaverScrapingService: jest.Mocked<INaverScrapingService>;
  let mockPlaceKeywordRepository: jest.Mocked<IPlaceKeywordRepository>;
  let mockRecordRankingUseCase: jest.Mocked<RecordRankingUseCase>;

  beforeEach(() => {
    mockNaverScrapingService = MockFactory.createNaverScrapingService();
    mockPlaceKeywordRepository = MockFactory.createPlaceKeywordRepository();
    mockRecordRankingUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new ScrapeRankingUseCase(
      mockNaverScrapingService,
      mockPlaceKeywordRepository,
      mockRecordRankingUseCase
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

    const validDto: ScrapeRankingDto = {
      placeKeywordId: 'pk-123',
    };

    const mockScrapingResult: NaverRankingResult = {
      rank: 5,
      searchResultCount: 100,
      found: true,
    };

    const mockRankingHistoryDto: RankingHistoryResponseDto = {
      id: 'rh-123',
      placeKeywordId: 'pk-123',
      rank: 5,
      searchResultCount: 100,
      checkedAt: new Date(),
      createdAt: new Date(),
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(mockScrapingResult);
        mockRecordRankingUseCase.execute.mockResolvedValue(mockRankingHistoryDto);
      });

      it('should successfully scrape and record ranking', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.placeKeywordId).toBe(mockPlaceKeyword.id);
        expect(result.rank).toBe(mockScrapingResult.rank);
        expect(result.searchResultCount).toBe(mockScrapingResult.searchResultCount);
        expect(result.found).toBe(mockScrapingResult.found);
        expect(result.rankingHistoryId).toBe(mockRankingHistoryDto.id);
      });

      it('should validate PlaceKeyword exists', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(validDto.placeKeywordId);
      });

      it('should call scraping service with correct parameters', async () => {
        await useCase.execute(validDto);

        expect(mockNaverScrapingService.scrapeRanking).toHaveBeenCalledWith(
          mockKeyword.keyword,
          mockPlaceKeyword.region,
          mockPlace.naverPlaceId
        );
      });

      it('should call RecordRankingUseCase with scraping result', async () => {
        await useCase.execute(validDto);

        expect(mockRecordRankingUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            placeKeywordId: mockPlaceKeyword.id,
            rank: mockScrapingResult.rank,
            searchResultCount: mockScrapingResult.searchResultCount,
            checkedAt: expect.any(Date),
          })
        );
      });

      it('should return ScrapeRankingResponseDto', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('placeKeywordId');
        expect(result).toHaveProperty('rank');
        expect(result).toHaveProperty('searchResultCount');
        expect(result).toHaveProperty('found');
        expect(result).toHaveProperty('checkedAt');
        expect(result).toHaveProperty('rankingHistoryId');
      });
    });

    describe('Error Cases - Validation', () => {
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
          `Cannot scrape ranking for inactive PlaceKeyword ${validDto.placeKeywordId}`
        );
      });

      it('should throw BadRequestError when Place is missing', async () => {
        const placeKeywordWithoutPlace = { ...mockPlaceKeyword, place: null as any };
        mockPlaceKeywordRepository.findById.mockResolvedValue(placeKeywordWithoutPlace);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          'Place naverPlaceId is required for scraping'
        );
      });

      it('should throw BadRequestError when naverPlaceId is missing', async () => {
        const placeWithoutNaverId = { ...mockPlace, naverPlaceId: null as any };
        const placeKeywordWithInvalidPlace = { ...mockPlaceKeyword, place: placeWithoutNaverId };
        mockPlaceKeywordRepository.findById.mockResolvedValue(placeKeywordWithInvalidPlace);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          'Place naverPlaceId is required for scraping'
        );
      });

      it('should throw BadRequestError when Keyword is missing', async () => {
        const placeKeywordWithoutKeyword = { ...mockPlaceKeyword, keyword: null as any };
        mockPlaceKeywordRepository.findById.mockResolvedValue(placeKeywordWithoutKeyword);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          'Keyword text is required for scraping'
        );
      });

      it('should throw BadRequestError when keyword text is missing', async () => {
        const keywordWithoutText = { ...mockKeyword, keyword: null as any };
        const placeKeywordWithInvalidKeyword = { ...mockPlaceKeyword, keyword: keywordWithoutText };
        mockPlaceKeywordRepository.findById.mockResolvedValue(placeKeywordWithInvalidKeyword);

        await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          'Keyword text is required for scraping'
        );
      });
    });

    describe('Error Cases - Service Errors', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should propagate scraping service errors', async () => {
        const error = new Error('Network timeout');
        mockNaverScrapingService.scrapeRanking.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate RecordRankingUseCase errors', async () => {
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(mockScrapingResult);
        const error = new Error('Failed to save ranking');
        mockRecordRankingUseCase.execute.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors', async () => {
        const error = new Error('Database connection failed');
        mockPlaceKeywordRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Not Found in Search Results', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
      });

      it('should handle place not found in search results', async () => {
        const notFoundResult: NaverRankingResult = {
          rank: null,
          searchResultCount: 100,
          found: false,
        };
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(notFoundResult);
        mockRecordRankingUseCase.execute.mockResolvedValue({
          ...mockRankingHistoryDto,
          rank: null,
        });

        const result = await useCase.execute(validDto);

        expect(result.found).toBe(false);
        expect(result.rank).toBeNull();
        expect(mockRecordRankingUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            rank: null,
          })
        );
      });

      it('should still record ranking when place not found', async () => {
        const notFoundResult: NaverRankingResult = {
          rank: null,
          searchResultCount: 50,
          found: false,
        };
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(notFoundResult);
        mockRecordRankingUseCase.execute.mockResolvedValue(mockRankingHistoryDto);

        await useCase.execute(validDto);

        expect(mockRecordRankingUseCase.execute).toHaveBeenCalled();
      });
    });

    describe('Null Region Handling', () => {
      beforeEach(() => {
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(mockScrapingResult);
        mockRecordRankingUseCase.execute.mockResolvedValue(mockRankingHistoryDto);
      });

      it('should handle PlaceKeyword with null region', async () => {
        const placeKeywordWithNullRegion = { ...mockPlaceKeyword, region: null };
        mockPlaceKeywordRepository.findById.mockResolvedValue(placeKeywordWithNullRegion);

        await useCase.execute(validDto);

        expect(mockNaverScrapingService.scrapeRanking).toHaveBeenCalledWith(
          mockKeyword.keyword,
          null,
          mockPlace.naverPlaceId
        );
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(mockScrapingResult);
        mockRecordRankingUseCase.execute.mockResolvedValue(mockRankingHistoryDto);
      });

      it('should validate PlaceKeyword before scraping', async () => {
        await useCase.execute(validDto);

        const findCall = mockPlaceKeywordRepository.findById.mock.invocationCallOrder[0];
        const scrapeCall = mockNaverScrapingService.scrapeRanking.mock.invocationCallOrder[0];

        expect(findCall).toBeLessThan(scrapeCall);
      });

      it('should scrape before recording', async () => {
        await useCase.execute(validDto);

        const scrapeCall = mockNaverScrapingService.scrapeRanking.mock.invocationCallOrder[0];
        const recordCall = mockRecordRankingUseCase.execute.mock.invocationCallOrder[0];

        expect(scrapeCall).toBeLessThan(recordCall);
      });

      it('should not scrape if PlaceKeyword not found', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockNaverScrapingService.scrapeRanking).not.toHaveBeenCalled();
        expect(mockRecordRankingUseCase.execute).not.toHaveBeenCalled();
      });

      it('should not record if scraping fails', async () => {
        mockNaverScrapingService.scrapeRanking.mockRejectedValue(new Error('Scraping failed'));

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockRecordRankingUseCase.execute).not.toHaveBeenCalled();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(mockScrapingResult);
        mockRecordRankingUseCase.execute.mockResolvedValue(mockRankingHistoryDto);
      });

      it('should handle rank 1 (top ranking)', async () => {
        const topResult: NaverRankingResult = {
          rank: 1,
          searchResultCount: 500,
          found: true,
        };
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(topResult);

        const result = await useCase.execute(validDto);

        expect(result.rank).toBe(1);
      });

      it('should handle very high rank', async () => {
        const highRankResult: NaverRankingResult = {
          rank: 9999,
          searchResultCount: 10000,
          found: true,
        };
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(highRankResult);

        const result = await useCase.execute(validDto);

        expect(result.rank).toBe(9999);
      });

      it('should handle zero search results', async () => {
        const zeroResultsResult: NaverRankingResult = {
          rank: null,
          searchResultCount: 0,
          found: false,
        };
        mockNaverScrapingService.scrapeRanking.mockResolvedValue(zeroResultsResult);

        const result = await useCase.execute(validDto);

        expect(result.searchResultCount).toBe(0);
      });

      it('should handle different PlaceKeyword ID formats', async () => {
        const uuidPlaceKeywordId = '550e8400-e29b-41d4-a716-446655440000';
        const dtoWithUuid: ScrapeRankingDto = {
          placeKeywordId: uuidPlaceKeywordId,
        };

        await useCase.execute(dtoWithUuid);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(uuidPlaceKeywordId);
      });
    });
  });
});
