import { ReviewHistory } from '@domain/entities/ReviewHistory';
import { Place } from '@domain/entities/Place';
import { randomUUID } from 'crypto';

/**
 * Fixture factory for creating ReviewHistory test data
 */
export class ReviewHistoryFixture {
  /**
   * Create a single review history with optional overrides
   */
  static create(place: Place, overrides?: Partial<ReviewHistory>): ReviewHistory {
    const history = new ReviewHistory();
    history.id = randomUUID();
    history.place = place;
    history.blogReviewCount = Math.floor(Math.random() * 100); // 0-99
    history.visitorReviewCount = Math.floor(Math.random() * 200); // 0-199
    history.averageRating = Number((Math.random() * 2 + 3).toFixed(1)); // 3.0-5.0
    history.checkedAt = new Date();
    history.createdAt = new Date();

    return Object.assign(history, overrides);
  }

  /**
   * Create multiple review histories for a place (time series)
   */
  static createMany(place: Place, count: number, overrides?: Partial<ReviewHistory>): ReviewHistory[] {
    return Array.from({ length: count }, (_, index) => {
      // Create history entries with increasing counts over time
      const history = this.create(place, {
        blogReviewCount: 10 + index * 5,
        visitorReviewCount: 20 + index * 10,
        averageRating: Number((4.0 + (index % 10) * 0.1).toFixed(1)),
        ...overrides,
      });
      // Set checkedAt to different days (most recent first when ordered DESC)
      history.checkedAt = new Date(Date.now() - (count - index) * 24 * 60 * 60 * 1000);
      return history;
    });
  }

  /**
   * Create with specific counts
   */
  static withCounts(place: Place, blogCount: number, visitorCount: number): ReviewHistory {
    return this.create(place, {
      blogReviewCount: blogCount,
      visitorReviewCount: visitorCount,
    });
  }

  /**
   * Create with specific average rating
   */
  static withRating(place: Place, averageRating: number): ReviewHistory {
    return this.create(place, { averageRating });
  }

  /**
   * Create with specific checked time
   */
  static withCheckedAt(place: Place, checkedAt: Date): ReviewHistory {
    return this.create(place, { checkedAt });
  }

  /**
   * Create with high review counts (popular place)
   */
  static popular(place: Place): ReviewHistory {
    return this.create(place, {
      blogReviewCount: 500,
      visitorReviewCount: 1000,
      averageRating: 4.5,
    });
  }

  /**
   * Create with low review counts (new/unpopular place)
   */
  static unpopular(place: Place): ReviewHistory {
    return this.create(place, {
      blogReviewCount: 5,
      visitorReviewCount: 10,
      averageRating: 3.5,
    });
  }

  /**
   * Create with no reviews
   */
  static noReviews(place: Place): ReviewHistory {
    return this.create(place, {
      blogReviewCount: 0,
      visitorReviewCount: 0,
      averageRating: null,
    });
  }
}
