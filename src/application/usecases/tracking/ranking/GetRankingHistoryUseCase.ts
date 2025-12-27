import { IRankingHistoryRepository } from '@domain/repositories/IRankingHistoryRepository';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { RankingHistory } from '@domain/entities/RankingHistory';
import { GetRankingHistoryDto } from '@application/dtos/tracking/ranking/GetRankingHistoryDto';
import { RankingHistoryResponseDto } from '@application/dtos/tracking/ranking/RankingHistoryResponseDto';

export class GetRankingHistoryUseCase {
  constructor(
    private readonly rankingHistoryRepository: IRankingHistoryRepository,
    private readonly placeKeywordRepository: IPlaceKeywordRepository
  ) {}

  async execute(dto: GetRankingHistoryDto): Promise<RankingHistoryResponseDto[]> {
    // 1. Validate PlaceKeyword exists
    const placeKeyword = await this.placeKeywordRepository.findById(dto.placeKeywordId);
    if (!placeKeyword) {
      throw new Error('PlaceKeyword not found');
    }

    // 2. Get history based on date range or limit
    let histories: RankingHistory[];

    if (dto.startDate && dto.endDate) {
      histories = await this.rankingHistoryRepository.findByPlaceKeywordIdInDateRange(
        dto.placeKeywordId,
        dto.startDate,
        dto.endDate
      );
    } else {
      histories = await this.rankingHistoryRepository.findByPlaceKeywordId(
        dto.placeKeywordId,
        dto.limit || 100
      );
    }

    // 3. Convert to DTOs with relations
    return histories.map((h) => RankingHistoryResponseDto.fromEntity(h, true));
  }
}
