import { Keyword } from '@domain/entities/Keyword';
import { randomUUID } from 'crypto';

/**
 * Fixture factory for creating Keyword test data
 */
export class KeywordFixture {
  private static counter = 0;
  private static popularKeywords = [
    '강남 맛집',
    '서울 카페',
    '홍대 술집',
    '명동 쇼핑',
    '부산 해운대',
    '제주도 관광',
    '이태원 클럽',
    '종로 한식당',
  ];

  /**
   * Create a single keyword with optional overrides
   */
  static create(overrides?: Partial<Keyword>): Keyword {
    this.counter++;
    const keyword = new Keyword();
    keyword.id = randomUUID();
    keyword.keyword = `테스트키워드${this.counter}`;
    keyword.createdAt = new Date();
    keyword.placeKeywords = [];

    return Object.assign(keyword, overrides);
  }

  /**
   * Create multiple keywords
   */
  static createMany(count: number, overrides?: Partial<Keyword>): Keyword[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create a keyword with specific keyword string
   */
  static withKeyword(keyword: string): Keyword {
    return this.create({ keyword });
  }

  /**
   * Create a popular keyword from predefined list
   */
  static popular(): Keyword {
    const keyword = this.popularKeywords[this.counter % this.popularKeywords.length];
    this.counter++;
    return this.create({ keyword });
  }

  /**
   * Create multiple popular keywords
   */
  static popularMany(count: number): Keyword[] {
    return Array.from({ length: count }, () => this.popular());
  }
}
