import { mock, MockProxy } from 'jest-mock-extended';
import {
  IUserRepository,
  IPlaceRepository,
  IKeywordRepository,
  IPlaceKeywordRepository,
  IRankingHistoryRepository,
  IReviewHistoryRepository,
  IReviewRepository,
  ICompetitorRepository,
  ICompetitorSnapshotRepository,
  INotificationSettingRepository,
  INotificationLogRepository,
  IRefreshTokenRepository,
} from '@domain/repositories';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';
import { IPasswordHashService } from '@domain/services/IPasswordHashService';
import {
  INaverScrapingService,
  NaverRankingResult,
  NaverReviewResult,
} from '@infrastructure/naver/interfaces/INaverScrapingService';

/**
 * Factory for creating type-safe mock objects
 * Uses jest-mock-extended for full TypeScript support
 */
export class MockFactory {
  // Repository Mocks
  static createUserRepository(): MockProxy<IUserRepository> {
    return mock<IUserRepository>();
  }

  static createPlaceRepository(): MockProxy<IPlaceRepository> {
    return mock<IPlaceRepository>();
  }

  static createKeywordRepository(): MockProxy<IKeywordRepository> {
    return mock<IKeywordRepository>();
  }

  static createPlaceKeywordRepository(): MockProxy<IPlaceKeywordRepository> {
    return mock<IPlaceKeywordRepository>();
  }

  static createRankingHistoryRepository(): MockProxy<IRankingHistoryRepository> {
    return mock<IRankingHistoryRepository>();
  }

  static createReviewHistoryRepository(): MockProxy<IReviewHistoryRepository> {
    return mock<IReviewHistoryRepository>();
  }

  static createReviewRepository(): MockProxy<IReviewRepository> {
    return mock<IReviewRepository>();
  }

  static createCompetitorRepository(): MockProxy<ICompetitorRepository> {
    return mock<ICompetitorRepository>();
  }

  static createCompetitorSnapshotRepository(): MockProxy<ICompetitorSnapshotRepository> {
    return mock<ICompetitorSnapshotRepository>();
  }

  static createNotificationSettingRepository(): MockProxy<INotificationSettingRepository> {
    return mock<INotificationSettingRepository>();
  }

  static createNotificationLogRepository(): MockProxy<INotificationLogRepository> {
    return mock<INotificationLogRepository>();
  }

  static createRefreshTokenRepository(): MockProxy<IRefreshTokenRepository> {
    return mock<IRefreshTokenRepository>();
  }

  // Service Mocks
  static createJwtAuthService(): MockProxy<IJwtAuthService> {
    return mock<IJwtAuthService>();
  }

  static createPasswordHashService(): MockProxy<IPasswordHashService> {
    return mock<IPasswordHashService>();
  }

  static createNaverScrapingService(): MockProxy<INaverScrapingService> {
    return mock<INaverScrapingService>();
  }
}

/**
 * Helper function to create a mock with default implementations
 */
export function createMock<T>(): MockProxy<T> {
  return mock<T>();
}

/**
 * Options for configuring MockNaverScrapingService behavior
 */
export interface MockNaverScrapingServiceOptions {
  defaultRanking?: Partial<NaverRankingResult>;
  defaultReviews?: Partial<NaverReviewResult>[];
  throwError?: boolean;
  errorMessage?: string;
}

/**
 * Mock implementation of INaverScrapingService for E2E testing
 * Returns predictable, fast results without actually running Puppeteer
 */
export class MockNaverScrapingService implements INaverScrapingService {
  private options: MockNaverScrapingServiceOptions;

  constructor(options: MockNaverScrapingServiceOptions = {}) {
    this.options = {
      defaultRanking: { rank: 5, searchResultCount: 100, found: true },
      defaultReviews: [
        {
          naverReviewId: 'mock-review-1',
          reviewType: 'VISITOR' as const,
          content: 'Great place! 좋은 장소입니다.',
          rating: 4.5,
          author: '김철수',
          publishedAt: new Date(),
        },
        {
          naverReviewId: 'mock-review-2',
          reviewType: 'BLOG' as const,
          content: 'Nice atmosphere. 분위기가 좋아요.',
          rating: 4.0,
          author: '이영희',
          publishedAt: new Date(),
        },
      ],
      throwError: false,
      errorMessage: 'Mock scraping error',
      ...options,
    };
  }

  async scrapeRanking(
    keyword: string,
    region: string | null,
    targetPlaceId: string
  ): Promise<NaverRankingResult> {
    if (this.options.throwError) {
      throw new Error(this.options.errorMessage);
    }

    return {
      rank: this.options.defaultRanking!.rank ?? 5,
      searchResultCount: this.options.defaultRanking!.searchResultCount ?? 100,
      found: this.options.defaultRanking!.found ?? true,
    };
  }

  async scrapeReviews(naverPlaceId: string, limit: number = 10): Promise<NaverReviewResult[]> {
    if (this.options.throwError) {
      throw new Error(this.options.errorMessage);
    }

    const reviews = this.options.defaultReviews!.map((partial, index) => ({
      naverReviewId: partial.naverReviewId ?? `mock-review-${index + 1}`,
      reviewType: (partial.reviewType ?? 'VISITOR') as 'BLOG' | 'VISITOR' | 'OTHER',
      content: partial.content ?? `Mock review content ${index + 1}`,
      rating: partial.rating ?? 4.0,
      author: partial.author ?? `Mock Author ${index + 1}`,
      publishedAt: partial.publishedAt ?? new Date(),
    }));

    return reviews.slice(0, limit);
  }

  async close(): Promise<void> {
    // No-op: Mock doesn't actually have browser to close
  }
}

/**
 * Factory function to create a configured MockNaverScrapingService
 * @param options - Configuration options for the mock service
 * @returns Configured mock service instance
 *
 * @example
 * ```typescript
 * // Create mock with custom ranking
 * const mockService = createMockNaverScrapingService({
 *   defaultRanking: { rank: 10, searchResultCount: 200, found: true }
 * });
 *
 * // Create mock that throws errors
 * const errorMock = createMockNaverScrapingService({
 *   throwError: true,
 *   errorMessage: 'Scraping failed'
 * });
 * ```
 */
export function createMockNaverScrapingService(
  options: MockNaverScrapingServiceOptions = {}
): MockNaverScrapingService {
  return new MockNaverScrapingService(options);
}
