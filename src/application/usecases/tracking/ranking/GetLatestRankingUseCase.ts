import { IRankingHistoryRepository } from '@domain/repositories/IRankingHistoryRepository';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { RankingHistoryResponseDto } from '@application/dtos/tracking/ranking/RankingHistoryResponseDto';

export class GetLatestRankingUseCase {
  constructor(
    private readonly rankingHistoryRepository: IRankingHistoryRepository,
    private readonly placeKeywordRepository: IPlaceKeywordRepository
  ) {}

  async execute(placeKeywordId: string): Promise<RankingHistoryResponseDto | null> {
    // 1. Validate PlaceKeyword exists
    const placeKeyword = await this.placeKeywordRepository.findById(placeKeywordId);
    if (!placeKeyword) {
      throw new Error('PlaceKeyword not found');
    }

    // 2. Get latest ranking
    const latest = await this.rankingHistoryRepository.findLatestByPlaceKeywordId(placeKeywordId);

    // 3. Return null if no history exists
    if (!latest) {
      return null;
    }

    // 4. Convert to DTO with relations
    return RankingHistoryResponseDto.fromEntity(latest, true);
  }
}
