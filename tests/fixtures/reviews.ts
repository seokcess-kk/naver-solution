import { Review } from '@domain/entities/Review';
import { Place } from '@domain/entities/Place';
import { randomUUID } from 'crypto';

/**
 * Fixture factory for creating Review test data
 */
export class ReviewFixture {
  private static counter = 0;
  private static sampleContents = [
    '정말 맛있었어요! 강추합니다.',
    '분위기가 너무 좋아요.',
    '직원분들이 친절하셨습니다.',
    '가격대비 좋아요.',
    '재방문 의사 있습니다.',
    '실망했어요. 다시는 안 갈 것 같아요.',
    '기대 이하였습니다.',
  ];
  private static authors = ['김철수', '이영희', '박민수', '최지현', '정우진'];

  /**
   * Create a single review with optional overrides
   */
  static create(place: Place, overrides?: Partial<Review>): Review {
    this.counter++;
    const review = new Review();
    review.id = randomUUID();
    review.place = place;
    review.naverReviewId = `naver-review-${this.counter}-${randomUUID().substring(0, 8)}`;
    review.reviewType = Math.random() > 0.5 ? 'VISITOR' : 'BLOG';
    review.content = this.sampleContents[this.counter % this.sampleContents.length];
    review.rating = Math.floor(Math.random() * 5) + 1; // 1-5
    review.author = this.authors[this.counter % this.authors.length];
    review.sentiment = review.rating >= 4 ? 'POSITIVE' : review.rating <= 2 ? 'NEGATIVE' : 'NEUTRAL';
    review.sentimentScore = review.rating >= 4 ? 0.8 : review.rating <= 2 ? -0.6 : 0.1;
    review.publishedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random within 30 days
    review.createdAt = new Date();

    return Object.assign(review, overrides);
  }

  /**
   * Create multiple reviews for a place
   */
  static createMany(place: Place, count: number, overrides?: Partial<Review>): Review[] {
    return Array.from({ length: count }, () => this.create(place, overrides));
  }

  /**
   * Create with specific review type
   */
  static visitor(place: Place): Review {
    return this.create(place, { reviewType: 'VISITOR' });
  }

  static blog(place: Place): Review {
    return this.create(place, { reviewType: 'BLOG' });
  }

  /**
   * Create with specific sentiment
   */
  static positive(place: Place): Review {
    return this.create(place, {
      rating: 5,
      sentiment: 'POSITIVE',
      sentimentScore: 0.9,
      content: '너무 좋았어요! 강력 추천합니다!',
    });
  }

  static negative(place: Place): Review {
    return this.create(place, {
      rating: 1,
      sentiment: 'NEGATIVE',
      sentimentScore: -0.8,
      content: '실망스러웠습니다. 다시 방문하지 않을 것 같아요.',
    });
  }

  static neutral(place: Place): Review {
    return this.create(place, {
      rating: 3,
      sentiment: 'NEUTRAL',
      sentimentScore: 0.0,
      content: '그냥 그랬어요. 평범합니다.',
    });
  }

  /**
   * Create with specific rating
   */
  static withRating(place: Place, rating: number): Review {
    const sentiment = rating >= 4 ? 'POSITIVE' : rating <= 2 ? 'NEGATIVE' : 'NEUTRAL';
    const sentimentScore = rating >= 4 ? 0.8 : rating <= 2 ? -0.6 : 0.1;
    return this.create(place, { rating, sentiment, sentimentScore });
  }

  /**
   * Create with specific naverReviewId
   */
  static withNaverReviewId(place: Place, naverReviewId: string): Review {
    return this.create(place, { naverReviewId });
  }

  /**
   * Create with specific published date
   */
  static withPublishedAt(place: Place, publishedAt: Date): Review {
    return this.create(place, { publishedAt });
  }
}
