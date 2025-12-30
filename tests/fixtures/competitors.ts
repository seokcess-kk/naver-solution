import { Competitor } from '@domain/entities/Competitor';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';
import { Place } from '@domain/entities/Place';
import { randomUUID } from 'crypto';

/**
 * Fixture factory for creating Competitor test data
 */
export class CompetitorFixture {
  private static counter = 0;
  private static competitorNames = [
    '경쟁업체 A',
    '경쟁업체 B',
    '라이벌 카페',
    '인기 맛집',
    '유명 브랜드',
  ];
  private static categories = ['음식점', '카페', '베이커리', '디저트', '한식당'];

  /**
   * Create a single competitor with optional overrides
   */
  static create(place: Place, overrides?: Partial<Competitor>): Competitor {
    this.counter++;
    const competitor = new Competitor();
    competitor.id = randomUUID();
    competitor.place = place;
    competitor.competitorNaverPlaceId = `comp-naver-${this.counter}`;
    competitor.competitorName = this.competitorNames[this.counter % this.competitorNames.length];
    competitor.category = this.categories[this.counter % this.categories.length];
    competitor.isActive = true;
    competitor.createdAt = new Date();
    competitor.competitorSnapshots = [];

    return Object.assign(competitor, overrides);
  }

  /**
   * Create multiple competitors for a place
   */
  static createMany(place: Place, count: number, overrides?: Partial<Competitor>): Competitor[] {
    return Array.from({ length: count }, () => this.create(place, overrides));
  }

  /**
   * Create with specific Naver Place ID
   */
  static withNaverPlaceId(place: Place, naverPlaceId: string): Competitor {
    return this.create(place, { competitorNaverPlaceId: naverPlaceId });
  }

  /**
   * Create with specific name and category
   */
  static withDetails(place: Place, name: string, category: string): Competitor {
    return this.create(place, {
      competitorName: name,
      category,
    });
  }

  /**
   * Create inactive competitor
   */
  static inactive(place: Place): Competitor {
    return this.create(place, { isActive: false });
  }

  /**
   * Create active competitor (explicit)
   */
  static active(place: Place): Competitor {
    return this.create(place, { isActive: true });
  }
}

/**
 * Fixture factory for creating CompetitorSnapshot test data
 */
export class CompetitorSnapshotFixture {
  /**
   * Create a single competitor snapshot with optional overrides
   */
  static create(competitor: Competitor, overrides?: Partial<CompetitorSnapshot>): CompetitorSnapshot {
    const snapshot = new CompetitorSnapshot();
    snapshot.id = randomUUID();
    snapshot.competitor = competitor;
    snapshot.rank = Math.floor(Math.random() * 15) + 1; // Random 1-15
    snapshot.blogReviewCount = Math.floor(Math.random() * 100); // 0-99
    snapshot.visitorReviewCount = Math.floor(Math.random() * 200); // 0-199
    snapshot.averageRating = Number((Math.random() * 2 + 3).toFixed(1)); // 3.0-5.0
    snapshot.checkedAt = new Date();
    snapshot.createdAt = new Date();

    return Object.assign(snapshot, overrides);
  }

  /**
   * Create multiple snapshots for a competitor (time series)
   */
  static createMany(
    competitor: Competitor,
    count: number,
    overrides?: Partial<CompetitorSnapshot>
  ): CompetitorSnapshot[] {
    return Array.from({ length: count }, (_, index) => {
      const snapshot = this.create(competitor, overrides);
      // Set checkedAt to different days
      snapshot.checkedAt = new Date(Date.now() - (count - index) * 24 * 60 * 60 * 1000);
      return snapshot;
    });
  }

  /**
   * Create with specific metrics
   */
  static withMetrics(
    competitor: Competitor,
    rank: number,
    blogCount: number,
    visitorCount: number,
    rating: number
  ): CompetitorSnapshot {
    return this.create(competitor, {
      rank,
      blogReviewCount: blogCount,
      visitorReviewCount: visitorCount,
      averageRating: rating,
    });
  }

  /**
   * Create with specific checked time
   */
  static withCheckedAt(competitor: Competitor, checkedAt: Date): CompetitorSnapshot {
    return this.create(competitor, { checkedAt });
  }

  /**
   * Create for popular competitor
   */
  static popular(competitor: Competitor): CompetitorSnapshot {
    return this.create(competitor, {
      rank: 2,
      blogReviewCount: 300,
      visitorReviewCount: 800,
      averageRating: 4.7,
    });
  }

  /**
   * Create for unpopular competitor
   */
  static unpopular(competitor: Competitor): CompetitorSnapshot {
    return this.create(competitor, {
      rank: 12,
      blogReviewCount: 10,
      visitorReviewCount: 30,
      averageRating: 3.5,
    });
  }
}
