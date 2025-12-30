import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { randomUUID } from 'crypto';

/**
 * Fixture factory for creating PlaceKeyword test data
 */
export class PlaceKeywordFixture {
  private static regions = ['강남구', '서초구', '송파구', '마포구', '용산구', '종로구'];

  /**
   * Create a single place-keyword relation with optional overrides
   */
  static create(place: Place, keyword: Keyword, overrides?: Partial<PlaceKeyword>): PlaceKeyword {
    const placeKeyword = new PlaceKeyword();
    placeKeyword.id = randomUUID();
    placeKeyword.place = place;
    placeKeyword.keyword = keyword;
    placeKeyword.region = null;
    placeKeyword.isActive = true;
    placeKeyword.createdAt = new Date();
    placeKeyword.rankingHistories = [];

    return Object.assign(placeKeyword, overrides);
  }

  /**
   * Create multiple place-keyword relations for a place with multiple keywords
   */
  static createMany(place: Place, keywords: Keyword[], overrides?: Partial<PlaceKeyword>): PlaceKeyword[] {
    return keywords.map((keyword) => this.create(place, keyword, overrides));
  }

  /**
   * Create with specific region
   */
  static withRegion(place: Place, keyword: Keyword, region: string): PlaceKeyword {
    return this.create(place, keyword, { region });
  }

  /**
   * Create with random region from predefined list
   */
  static withRandomRegion(place: Place, keyword: Keyword): PlaceKeyword {
    const region = this.regions[Math.floor(Math.random() * this.regions.length)];
    return this.create(place, keyword, { region });
  }

  /**
   * Create inactive place-keyword
   */
  static inactive(place: Place, keyword: Keyword): PlaceKeyword {
    return this.create(place, keyword, { isActive: false });
  }

  /**
   * Create active place-keyword (explicit)
   */
  static active(place: Place, keyword: Keyword): PlaceKeyword {
    return this.create(place, keyword, { isActive: true });
  }
}
