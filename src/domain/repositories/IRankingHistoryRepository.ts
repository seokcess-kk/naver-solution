import { RankingHistory } from '../entities/RankingHistory';

export interface IRankingHistoryRepository {
  findById(id: string): Promise<RankingHistory | null>;
  findAll(): Promise<RankingHistory[]>;
  save(rankingHistory: RankingHistory): Promise<RankingHistory>;
  update(id: string, data: Partial<RankingHistory>): Promise<RankingHistory>;
  delete(id: string): Promise<void>;

  findByPlaceKeywordId(placeKeywordId: string, limit?: number): Promise<RankingHistory[]>;
  findByPlaceKeywordIdInDateRange(
    placeKeywordId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RankingHistory[]>;
  findLatestByPlaceKeywordId(placeKeywordId: string): Promise<RankingHistory | null>;
}
