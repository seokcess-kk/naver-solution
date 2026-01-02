import { DataSource } from 'typeorm';

// Repositories
import { UserRepository } from '@infrastructure/repositories/UserRepository';
import { PlaceRepository } from '@infrastructure/repositories/PlaceRepository';
import { KeywordRepository } from '@infrastructure/repositories/KeywordRepository';
import { PlaceKeywordRepository } from '@infrastructure/repositories/PlaceKeywordRepository';
import { RankingHistoryRepository } from '@infrastructure/repositories/RankingHistoryRepository';
import { ReviewHistoryRepository } from '@infrastructure/repositories/ReviewHistoryRepository';
import { ReviewRepository } from '@infrastructure/repositories/ReviewRepository';
import { CompetitorRepository } from '@infrastructure/repositories/CompetitorRepository';
import { CompetitorSnapshotRepository } from '@infrastructure/repositories/CompetitorSnapshotRepository';
import { NotificationSettingRepository } from '@infrastructure/repositories/NotificationSettingRepository';
import { NotificationLogRepository } from '@infrastructure/repositories/NotificationLogRepository';
import { RefreshTokenRepository } from '@infrastructure/repositories/RefreshTokenRepository';

// Place Use Cases
import { CreatePlaceUseCase } from '@application/usecases/place/CreatePlaceUseCase';
import { GetPlaceUseCase } from '@application/usecases/place/GetPlaceUseCase';
import { ListPlacesUseCase } from '@application/usecases/place/ListPlacesUseCase';
import { UpdatePlaceUseCase } from '@application/usecases/place/UpdatePlaceUseCase';
import { UpdatePlaceActiveStatusUseCase } from '@application/usecases/place/UpdatePlaceActiveStatusUseCase';
import { DeletePlaceUseCase } from '@application/usecases/place/DeletePlaceUseCase';
import { GetPlaceStatsUseCase } from '@application/usecases/place/GetPlaceStatsUseCase';

// Keyword Use Cases
import { ListKeywordsUseCase } from '@application/usecases/keyword/ListKeywordsUseCase';
import { GetPlaceKeywordsUseCase } from '@application/usecases/keyword/GetPlaceKeywordsUseCase';
import { AddPlaceKeywordUseCase } from '@application/usecases/keyword/AddPlaceKeywordUseCase';
import { RemovePlaceKeywordUseCase } from '@application/usecases/keyword/RemovePlaceKeywordUseCase';

// Ranking Use Cases
import { RecordRankingUseCase } from '@application/usecases/tracking/ranking/RecordRankingUseCase';
import { GetRankingHistoryUseCase } from '@application/usecases/tracking/ranking/GetRankingHistoryUseCase';
import { GetLatestRankingUseCase } from '@application/usecases/tracking/ranking/GetLatestRankingUseCase';
import { ScrapeRankingUseCase } from '@application/usecases/tracking/ranking/ScrapeRankingUseCase';

// Review Use Cases
import { RecordReviewUseCase } from '@application/usecases/tracking/review/RecordReviewUseCase';
import { GetPlaceReviewsUseCase } from '@application/usecases/tracking/review/GetPlaceReviewsUseCase';
import { GetReviewsBySentimentUseCase } from '@application/usecases/tracking/review/GetReviewsBySentimentUseCase';
import { ScrapeReviewsUseCase } from '@application/usecases/tracking/review/ScrapeReviewsUseCase';

// Review History Use Cases
import { RecordReviewHistoryUseCase } from '@application/usecases/tracking/review-history/RecordReviewHistoryUseCase';
import { GetReviewHistoryUseCase } from '@application/usecases/tracking/review-history/GetReviewHistoryUseCase';
import { GetLatestReviewStatsUseCase } from '@application/usecases/tracking/review-history/GetLatestReviewStatsUseCase';

// Competitor Use Cases
import { AddCompetitorUseCase } from '@application/usecases/tracking/competitor/AddCompetitorUseCase';
import { RecordCompetitorSnapshotUseCase } from '@application/usecases/tracking/competitor/RecordCompetitorSnapshotUseCase';
import { GetCompetitorHistoryUseCase } from '@application/usecases/tracking/competitor/GetCompetitorHistoryUseCase';

// Auth Services
import { PasswordHashService } from '@infrastructure/auth/PasswordHashService';
import { JwtAuthService } from '@infrastructure/auth/JwtAuthService';
import { IPasswordHashService } from '@domain/services/IPasswordHashService';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';

// Naver Services
import { NaverScrapingService } from '@infrastructure/naver/NaverScrapingService';
import { HybridNaverScrapingService } from '@infrastructure/naver/HybridNaverScrapingService';
import { INaverScrapingService } from '@infrastructure/naver/interfaces/INaverScrapingService';

// Auth Use Cases
import {
  RegisterUserUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
  GetUserProfileUseCase,
  LogoutUseCase,
} from '@application/usecases/auth';

// Service Registry
import { ServiceRegistry, ServiceName } from './ServiceRegistry';

/**
 * Dependency Injection Container
 * Manages singleton instances of repositories, services, and use cases.
 * Uses ServiceRegistry for compile-time type safety and IDE autocomplete.
 */
export class DIContainer {
  private static instance: DIContainer;
  private services: Map<ServiceName, any> = new Map();

  private constructor(dataSource: DataSource) {
    this.initializeServices();
    this.initializeRepositories(dataSource);
    this.initializeUseCases();
  }

  /**
   * Get or create singleton instance
   */
  public static getInstance(dataSource: DataSource): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer(dataSource);
    }
    return DIContainer.instance;
  }

  /**
   * Get a service by name with compile-time type safety
   * @param name - The service name (must be a valid key in ServiceRegistry)
   * @returns The service instance with the correct type
   * @throws Error if service is not found in container
   *
   * @example
   * const userRepo = container.get('UserRepository'); // Type: IUserRepository
   * const loginUseCase = container.get('LoginUseCase'); // Type: LoginUseCase
   */
  public get<K extends ServiceName>(name: K): ServiceRegistry[K] {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found in container: ${name}`);
    }
    return service as ServiceRegistry[K];
  }

  /**
   * Get container statistics for debugging
   * @returns Object containing total service count and list of all service names
   */
  public getStats() {
    return {
      totalServices: this.services.size,
      services: Array.from(this.services.keys()).sort(),
    };
  }

  /**
   * Initialize all service instances
   */
  private initializeServices(): void {
    this.services.set('PasswordHashService', new PasswordHashService() as IPasswordHashService);
    this.services.set('JwtAuthService', new JwtAuthService() as IJwtAuthService);
    this.services.set('NaverScrapingService', new HybridNaverScrapingService() as INaverScrapingService);
  }

  /**
   * Initialize all repository instances
   */
  private initializeRepositories(dataSource: DataSource): void {
    this.services.set('UserRepository', new UserRepository(dataSource));
    this.services.set('PlaceRepository', new PlaceRepository(dataSource));
    this.services.set('KeywordRepository', new KeywordRepository(dataSource));
    this.services.set('PlaceKeywordRepository', new PlaceKeywordRepository(dataSource));
    this.services.set('RankingHistoryRepository', new RankingHistoryRepository(dataSource));
    this.services.set('ReviewHistoryRepository', new ReviewHistoryRepository(dataSource));
    this.services.set('ReviewRepository', new ReviewRepository(dataSource));
    this.services.set('CompetitorRepository', new CompetitorRepository(dataSource));
    this.services.set('CompetitorSnapshotRepository', new CompetitorSnapshotRepository(dataSource));
    this.services.set('NotificationSettingRepository', new NotificationSettingRepository(dataSource));
    this.services.set('NotificationLogRepository', new NotificationLogRepository(dataSource));
    this.services.set('RefreshTokenRepository', new RefreshTokenRepository(dataSource));
  }

  /**
   * Initialize all use case instances with their dependencies
   */
  private initializeUseCases(): void {
    // Place Use Cases
    this.services.set(
      'CreatePlaceUseCase',
      new CreatePlaceUseCase(
        this.get('PlaceRepository'),
        this.get('UserRepository')
      )
    );

    this.services.set(
      'GetPlaceUseCase',
      new GetPlaceUseCase(this.get('PlaceRepository'))
    );

    this.services.set(
      'ListPlacesUseCase',
      new ListPlacesUseCase(
        this.get('PlaceRepository'),
        this.get('UserRepository')
      )
    );

    this.services.set(
      'UpdatePlaceUseCase',
      new UpdatePlaceUseCase(this.get('PlaceRepository'))
    );

    this.services.set(
      'UpdatePlaceActiveStatusUseCase',
      new UpdatePlaceActiveStatusUseCase(this.get('PlaceRepository'))
    );

    this.services.set(
      'DeletePlaceUseCase',
      new DeletePlaceUseCase(this.get('PlaceRepository'))
    );

    this.services.set(
      'GetPlaceStatsUseCase',
      new GetPlaceStatsUseCase(this.get('PlaceRepository'))
    );

    // Keyword Use Cases
    this.services.set(
      'ListKeywordsUseCase',
      new ListKeywordsUseCase(this.get('KeywordRepository'))
    );

    this.services.set(
      'GetPlaceKeywordsUseCase',
      new GetPlaceKeywordsUseCase(
        this.get('PlaceKeywordRepository'),
        this.get('PlaceRepository')
      )
    );

    this.services.set(
      'AddPlaceKeywordUseCase',
      new AddPlaceKeywordUseCase(
        this.get('PlaceKeywordRepository'),
        this.get('PlaceRepository'),
        this.get('KeywordRepository')
      )
    );

    this.services.set(
      'RemovePlaceKeywordUseCase',
      new RemovePlaceKeywordUseCase(this.get('PlaceKeywordRepository'))
    );

    // Ranking Use Cases
    this.services.set(
      'RecordRankingUseCase',
      new RecordRankingUseCase(
        this.get('RankingHistoryRepository'),
        this.get('PlaceKeywordRepository')
      )
    );

    this.services.set(
      'GetRankingHistoryUseCase',
      new GetRankingHistoryUseCase(
        this.get('RankingHistoryRepository'),
        this.get('PlaceKeywordRepository')
      )
    );

    this.services.set(
      'GetLatestRankingUseCase',
      new GetLatestRankingUseCase(
        this.get('RankingHistoryRepository'),
        this.get('PlaceKeywordRepository')
      )
    );

    this.services.set(
      'ScrapeRankingUseCase',
      new ScrapeRankingUseCase(
        this.get('NaverScrapingService'),
        this.get('PlaceKeywordRepository'),
        this.get('RecordRankingUseCase')
      )
    );

    // Review Use Cases
    this.services.set(
      'RecordReviewUseCase',
      new RecordReviewUseCase(
        this.get('ReviewRepository'),
        this.get('PlaceRepository')
      )
    );

    this.services.set(
      'GetPlaceReviewsUseCase',
      new GetPlaceReviewsUseCase(
        this.get('ReviewRepository'),
        this.get('PlaceRepository')
      )
    );

    this.services.set(
      'GetReviewsBySentimentUseCase',
      new GetReviewsBySentimentUseCase(
        this.get('ReviewRepository'),
        this.get('PlaceRepository')
      )
    );

    this.services.set(
      'ScrapeReviewsUseCase',
      new ScrapeReviewsUseCase(
        this.get('NaverScrapingService'),
        this.get('PlaceRepository'),
        this.get('ReviewRepository'),
        this.get('RecordReviewUseCase')
      )
    );

    // Review History Use Cases
    this.services.set(
      'RecordReviewHistoryUseCase',
      new RecordReviewHistoryUseCase(
        this.get('ReviewHistoryRepository'),
        this.get('PlaceRepository')
      )
    );

    this.services.set(
      'GetReviewHistoryUseCase',
      new GetReviewHistoryUseCase(
        this.get('ReviewHistoryRepository'),
        this.get('PlaceRepository')
      )
    );

    this.services.set(
      'GetLatestReviewStatsUseCase',
      new GetLatestReviewStatsUseCase(
        this.get('ReviewHistoryRepository'),
        this.get('PlaceRepository')
      )
    );

    // Competitor Use Cases
    this.services.set(
      'AddCompetitorUseCase',
      new AddCompetitorUseCase(
        this.get('CompetitorRepository'),
        this.get('PlaceRepository')
      )
    );

    this.services.set(
      'RecordCompetitorSnapshotUseCase',
      new RecordCompetitorSnapshotUseCase(
        this.get('CompetitorSnapshotRepository'),
        this.get('CompetitorRepository')
      )
    );

    this.services.set(
      'GetCompetitorHistoryUseCase',
      new GetCompetitorHistoryUseCase(
        this.get('CompetitorSnapshotRepository'),
        this.get('CompetitorRepository')
      )
    );

    // Auth Use Cases
    this.services.set(
      'RegisterUserUseCase',
      new RegisterUserUseCase(
        this.get('UserRepository'),
        this.get('PasswordHashService')
      )
    );

    this.services.set(
      'LoginUseCase',
      new LoginUseCase(
        this.get('UserRepository'),
        this.get('PasswordHashService'),
        this.get('JwtAuthService'),
        this.get('RefreshTokenRepository')
      )
    );

    this.services.set(
      'RefreshTokenUseCase',
      new RefreshTokenUseCase(
        this.get('RefreshTokenRepository'),
        this.get('JwtAuthService')
      )
    );

    this.services.set(
      'GetUserProfileUseCase',
      new GetUserProfileUseCase(this.get('UserRepository'))
    );

    this.services.set(
      'LogoutUseCase',
      new LogoutUseCase(this.get('RefreshTokenRepository'))
    );
  }
}
