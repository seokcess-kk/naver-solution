import { INaverScrapingService } from '@infrastructure/naver/interfaces/INaverScrapingService';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { RecordRankingUseCase } from './RecordRankingUseCase';
import { ScrapeRankingDto } from '@application/dtos/tracking/ranking/ScrapeRankingDto';
import { ScrapeRankingResponseDto } from '@application/dtos/tracking/ranking/ScrapeRankingResponseDto';
import { RecordRankingDto } from '@application/dtos/tracking/ranking/RecordRankingDto';
import { NotFoundError, BadRequestError } from '@application/errors/HttpError';

/**
 * Use case for scraping Naver ranking for a PlaceKeyword
 */
export class ScrapeRankingUseCase {
  constructor(
    private readonly naverScrapingService: INaverScrapingService,
    private readonly placeKeywordRepository: IPlaceKeywordRepository,
    private readonly recordRankingUseCase: RecordRankingUseCase
  ) {}

  async execute(dto: ScrapeRankingDto): Promise<ScrapeRankingResponseDto> {
    // 1. Validate PlaceKeyword exists
    const placeKeyword = await this.placeKeywordRepository.findById(dto.placeKeywordId);
    if (!placeKeyword) {
      throw new NotFoundError(`PlaceKeyword with id ${dto.placeKeywordId} not found`);
    }

    // 2. Validate PlaceKeyword is active
    if (!placeKeyword.isActive) {
      throw new BadRequestError(`Cannot scrape ranking for inactive PlaceKeyword ${dto.placeKeywordId}`);
    }

    // 3. Validate required Place data
    if (!placeKeyword.place || !placeKeyword.place.naverPlaceId) {
      throw new BadRequestError('Place naverPlaceId is required for scraping');
    }

    // 4. Validate required Keyword data
    if (!placeKeyword.keyword || !placeKeyword.keyword.keyword) {
      throw new BadRequestError('Keyword text is required for scraping');
    }

    // 5. Execute Naver scraping
    const scrapingResult = await this.naverScrapingService.scrapeRanking(
      placeKeyword.keyword.keyword,
      placeKeyword.region,
      placeKeyword.place.naverPlaceId
    );

    // 6. Record ranking result to database
    const checkedAt = new Date();
    const recordDto: RecordRankingDto = {
      placeKeywordId: placeKeyword.id,
      rank: scrapingResult.rank,
      searchResultCount: scrapingResult.searchResultCount,
      checkedAt,
    };

    const rankingHistory = await this.recordRankingUseCase.execute(recordDto);

    // 7. Return response DTO
    const response: ScrapeRankingResponseDto = {
      placeKeywordId: placeKeyword.id,
      rank: scrapingResult.rank,
      searchResultCount: scrapingResult.searchResultCount,
      found: scrapingResult.found,
      checkedAt,
      rankingHistoryId: rankingHistory.id,
    };

    return response;
  }
}
