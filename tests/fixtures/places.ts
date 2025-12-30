import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { randomUUID } from 'crypto';

/**
 * Fixture factory for creating Place test data
 */
export class PlaceFixture {
  private static counter = 0;
  private static categories = ['음식점', '카페', '병원', '미용실', '편의점', '학원'];

  /**
   * Create a single place with optional overrides
   */
  static create(user: User, overrides?: Partial<Place>): Place {
    this.counter++;
    const place = new Place();
    place.id = randomUUID();
    place.user = user;
    place.naverPlaceId = (100000 + this.counter).toString();
    place.name = `Test Place ${this.counter}`;
    place.category = this.categories[this.counter % this.categories.length];
    place.address = `서울특별시 강남구 테스트로 ${this.counter}`;
    place.naverPlaceUrl = `https://place.naver.com/place/${place.naverPlaceId}`;
    place.isActive = true;
    place.createdAt = new Date();
    place.updatedAt = new Date();
    place.placeKeywords = [];
    place.reviews = [];
    place.reviewHistories = [];
    place.competitors = [];
    place.notificationSettings = [];
    place.notificationLogs = [];

    return Object.assign(place, overrides);
  }

  /**
   * Create multiple places for a user
   */
  static createMany(user: User, count: number, overrides?: Partial<Place>): Place[] {
    return Array.from({ length: count }, () => this.create(user, overrides));
  }

  /**
   * Create an active place
   */
  static active(user: User): Place {
    return this.create(user, { isActive: true });
  }

  /**
   * Create an inactive place
   */
  static inactive(user: User): Place {
    return this.create(user, { isActive: false });
  }

  /**
   * Create a restaurant place
   */
  static restaurant(user: User): Place {
    return this.create(user, {
      category: '음식점',
      name: faker.company.name() + ' 식당',
    });
  }

  /**
   * Create a cafe place
   */
  static cafe(user: User): Place {
    return this.create(user, {
      category: '카페',
      name: faker.company.name() + ' 카페',
    });
  }

  /**
   * Create a place with specific Naver Place ID
   */
  static withNaverPlaceId(user: User, naverPlaceId: string): Place {
    return this.create(user, {
      naverPlaceId,
      naverPlaceUrl: `https://place.naver.com/place/${naverPlaceId}`,
    });
  }
}
