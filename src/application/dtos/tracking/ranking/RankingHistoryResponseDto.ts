import { Exclude, Expose } from 'class-transformer';
import { RankingHistory } from '@domain/entities/RankingHistory';

@Exclude()
export class RankingHistoryResponseDto {
  @Expose()
  id: string;

  @Expose()
  placeKeywordId: string;

  @Expose()
  rank: number | null;

  @Expose()
  searchResultCount: number | null;

  @Expose()
  checkedAt: Date;

  @Expose()
  createdAt: Date;

  // Optional: 관계 데이터
  @Expose()
  placeName?: string;

  @Expose()
  keywordText?: string;

  @Expose()
  region?: string | null;

  static fromEntity(
    rankingHistory: RankingHistory,
    includeRelations = false
  ): RankingHistoryResponseDto {
    const dto = new RankingHistoryResponseDto();
    dto.id = rankingHistory.id;
    dto.placeKeywordId = rankingHistory.placeKeyword.id;
    dto.rank = rankingHistory.rank;
    dto.searchResultCount = rankingHistory.searchResultCount;
    dto.checkedAt = rankingHistory.checkedAt;
    dto.createdAt = rankingHistory.createdAt;

    if (includeRelations && rankingHistory.placeKeyword) {
      if (rankingHistory.placeKeyword.place) {
        dto.placeName = rankingHistory.placeKeyword.place.name;
      }
      if (rankingHistory.placeKeyword.keyword) {
        dto.keywordText = rankingHistory.placeKeyword.keyword.keyword;
      }
      dto.region = rankingHistory.placeKeyword.region;
    }

    return dto;
  }
}
