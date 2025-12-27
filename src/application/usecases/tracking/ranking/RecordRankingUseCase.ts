import { IRankingHistoryRepository } from '@domain/repositories/IRankingHistoryRepository';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { RankingHistory } from '@domain/entities/RankingHistory';
import { RecordRankingDto } from '@application/dtos/tracking/ranking/RecordRankingDto';
import { RankingHistoryResponseDto } from '@application/dtos/tracking/ranking/RankingHistoryResponseDto';

export class RecordRankingUseCase {
  constructor(
    private readonly rankingHistoryRepository: IRankingHistoryRepository,
    private readonly placeKeywordRepository: IPlaceKeywordRepository
  ) {}

  async execute(dto: RecordRankingDto): Promise<RankingHistoryResponseDto> {
    // 1. Validate PlaceKeyword exists
    const placeKeyword = await this.placeKeywordRepository.findById(dto.placeKeywordId);
    if (!placeKeyword) {
      throw new Error('PlaceKeyword not found');
    }

    // 2. Business Rule: PlaceKeyword must be active
    if (!placeKeyword.isActive) {
      throw new Error('Cannot record ranking for inactive PlaceKeyword');
    }

    // 3. Create RankingHistory entity
    const rankingHistory = new RankingHistory();
    rankingHistory.placeKeyword = placeKeyword;
    rankingHistory.rank = dto.rank;
    rankingHistory.searchResultCount = dto.searchResultCount;
    rankingHistory.checkedAt = dto.checkedAt;

    // 4. Save to repository
    const saved = await this.rankingHistoryRepository.save(rankingHistory);

    // 5. Convert to DTO and return
    return RankingHistoryResponseDto.fromEntity(saved);
  }
}
