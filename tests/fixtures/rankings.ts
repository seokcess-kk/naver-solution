import { RankingHistory } from '@domain/entities/RankingHistory';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { randomUUID } from 'crypto';

/**
 * Fixture factory for creating RankingHistory test data
 */
export class RankingHistoryFixture {
  /**
   * Create a single ranking history with optional overrides
   */
  static create(placeKeyword: PlaceKeyword, overrides?: Partial<RankingHistory>): RankingHistory {
    const ranking = new RankingHistory();
    ranking.id = randomUUID();
    ranking.placeKeyword = placeKeyword;
    ranking.rank = Math.floor(Math.random() * 20) + 1; // Random rank 1-20
    ranking.searchResultCount = Math.floor(Math.random() * 500) + 100; // Random 100-600
    ranking.checkedAt = new Date();
    ranking.createdAt = new Date();

    return Object.assign(ranking, overrides);
  }

  /**
   * Create multiple ranking histories for a place-keyword
   */
  static createMany(
    placeKeyword: PlaceKeyword,
    count: number,
    overrides?: Partial<RankingHistory>
  ): RankingHistory[] {
    return Array.from({ length: count }, (_, index) => {
      // Create rankings with different checkedAt timestamps
      const ranking = this.create(placeKeyword, overrides);
      ranking.checkedAt = new Date(Date.now() - (count - index) * 24 * 60 * 60 * 1000); // Each day back
      return ranking;
    });
  }

  /**
   * Create with specific rank
   */
  static withRank(placeKeyword: PlaceKeyword, rank: number): RankingHistory {
    return this.create(placeKeyword, { rank });
  }

  /**
   * Create with rank not found (null)
   */
  static notFound(placeKeyword: PlaceKeyword): RankingHistory {
    return this.create(placeKeyword, {
      rank: null,
      searchResultCount: 0,
    });
  }

  /**
   * Create with specific checked time
   */
  static withCheckedAt(placeKeyword: PlaceKeyword, checkedAt: Date): RankingHistory {
    return this.create(placeKeyword, { checkedAt });
  }

  /**
   * Create top ranking (rank 1-3)
   */
  static topRanking(placeKeyword: PlaceKeyword): RankingHistory {
    const rank = Math.floor(Math.random() * 3) + 1; // Random 1-3
    return this.create(placeKeyword, { rank, searchResultCount: 500 });
  }

  /**
   * Create low ranking (rank > 10)
   */
  static lowRanking(placeKeyword: PlaceKeyword): RankingHistory {
    const rank = Math.floor(Math.random() * 20) + 11; // Random 11-30
    return this.create(placeKeyword, { rank, searchResultCount: 300 });
  }
}
