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
import { INaverScrapingService } from '@infrastructure/naver/interfaces/INaverScrapingService';

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
