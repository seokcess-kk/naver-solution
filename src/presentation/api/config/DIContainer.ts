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

// Place Use Cases
import { CreatePlaceUseCase } from '@application/usecases/place/CreatePlaceUseCase';
import { GetPlaceUseCase } from '@application/usecases/place/GetPlaceUseCase';
import { ListPlacesUseCase } from '@application/usecases/place/ListPlacesUseCase';
import { UpdatePlaceUseCase } from '@application/usecases/place/UpdatePlaceUseCase';
import { UpdatePlaceActiveStatusUseCase } from '@application/usecases/place/UpdatePlaceActiveStatusUseCase';
import { DeletePlaceUseCase } from '@application/usecases/place/DeletePlaceUseCase';

// Ranking Use Cases
import { RecordRankingUseCase } from '@application/usecases/tracking/ranking/RecordRankingUseCase';
import { GetRankingHistoryUseCase } from '@application/usecases/tracking/ranking/GetRankingHistoryUseCase';
import { GetLatestRankingUseCase } from '@application/usecases/tracking/ranking/GetLatestRankingUseCase';

// Review Use Cases
import { RecordReviewUseCase } from '@application/usecases/tracking/review/RecordReviewUseCase';
import { GetPlaceReviewsUseCase } from '@application/usecases/tracking/review/GetPlaceReviewsUseCase';
import { GetReviewsBySentimentUseCase } from '@application/usecases/tracking/review/GetReviewsBySentimentUseCase';

// Review History Use Cases
import { RecordReviewHistoryUseCase } from '@application/usecases/tracking/review-history/RecordReviewHistoryUseCase';
import { GetReviewHistoryUseCase } from '@application/usecases/tracking/review-history/GetReviewHistoryUseCase';
import { GetLatestReviewStatsUseCase } from '@application/usecases/tracking/review-history/GetLatestReviewStatsUseCase';

// Competitor Use Cases
import { AddCompetitorUseCase } from '@application/usecases/tracking/competitor/AddCompetitorUseCase';
import { RecordCompetitorSnapshotUseCase } from '@application/usecases/tracking/competitor/RecordCompetitorSnapshotUseCase';
import { GetCompetitorHistoryUseCase } from '@application/usecases/tracking/competitor/GetCompetitorHistoryUseCase';

/**
 * Dependency Injection Container
 * Manages singleton instances of repositories and use cases
 */
export class DIContainer {
  private static instance: DIContainer;
  private repositories: Map<string, any> = new Map();
  private useCases: Map<string, any> = new Map();

  private constructor(dataSource: DataSource) {
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
   * Get a use case or repository by key
   */
  public get<T>(key: string): T {
    const instance = this.useCases.get(key) || this.repositories.get(key);
    if (!instance) {
      throw new Error(`Dependency not found: ${key}`);
    }
    return instance as T;
  }

  /**
   * Initialize all repository instances
   */
  private initializeRepositories(dataSource: DataSource): void {
    this.repositories.set('UserRepository', new UserRepository(dataSource));
    this.repositories.set('PlaceRepository', new PlaceRepository(dataSource));
    this.repositories.set('KeywordRepository', new KeywordRepository(dataSource));
    this.repositories.set('PlaceKeywordRepository', new PlaceKeywordRepository(dataSource));
    this.repositories.set('RankingHistoryRepository', new RankingHistoryRepository(dataSource));
    this.repositories.set('ReviewHistoryRepository', new ReviewHistoryRepository(dataSource));
    this.repositories.set('ReviewRepository', new ReviewRepository(dataSource));
    this.repositories.set('CompetitorRepository', new CompetitorRepository(dataSource));
    this.repositories.set('CompetitorSnapshotRepository', new CompetitorSnapshotRepository(dataSource));
    this.repositories.set('NotificationSettingRepository', new NotificationSettingRepository(dataSource));
    this.repositories.set('NotificationLogRepository', new NotificationLogRepository(dataSource));
  }

  /**
   * Initialize all use case instances with their dependencies
   */
  private initializeUseCases(): void {
    // Place Use Cases
    this.useCases.set(
      'CreatePlaceUseCase',
      new CreatePlaceUseCase(
        this.get('PlaceRepository'),
        this.get('UserRepository')
      )
    );

    this.useCases.set(
      'GetPlaceUseCase',
      new GetPlaceUseCase(this.get('PlaceRepository'))
    );

    this.useCases.set(
      'ListPlacesUseCase',
      new ListPlacesUseCase(
        this.get('PlaceRepository'),
        this.get('UserRepository')
      )
    );

    this.useCases.set(
      'UpdatePlaceUseCase',
      new UpdatePlaceUseCase(this.get('PlaceRepository'))
    );

    this.useCases.set(
      'UpdatePlaceActiveStatusUseCase',
      new UpdatePlaceActiveStatusUseCase(this.get('PlaceRepository'))
    );

    this.useCases.set(
      'DeletePlaceUseCase',
      new DeletePlaceUseCase(this.get('PlaceRepository'))
    );

    // Ranking Use Cases
    this.useCases.set(
      'RecordRankingUseCase',
      new RecordRankingUseCase(
        this.get('RankingHistoryRepository'),
        this.get('PlaceKeywordRepository')
      )
    );

    this.useCases.set(
      'GetRankingHistoryUseCase',
      new GetRankingHistoryUseCase(
        this.get('RankingHistoryRepository'),
        this.get('PlaceKeywordRepository')
      )
    );

    this.useCases.set(
      'GetLatestRankingUseCase',
      new GetLatestRankingUseCase(
        this.get('RankingHistoryRepository'),
        this.get('PlaceKeywordRepository')
      )
    );

    // Review Use Cases
    this.useCases.set(
      'RecordReviewUseCase',
      new RecordReviewUseCase(
        this.get('ReviewRepository'),
        this.get('PlaceRepository')
      )
    );

    this.useCases.set(
      'GetPlaceReviewsUseCase',
      new GetPlaceReviewsUseCase(
        this.get('ReviewRepository'),
        this.get('PlaceRepository')
      )
    );

    this.useCases.set(
      'GetReviewsBySentimentUseCase',
      new GetReviewsBySentimentUseCase(
        this.get('ReviewRepository'),
        this.get('PlaceRepository')
      )
    );

    // Review History Use Cases
    this.useCases.set(
      'RecordReviewHistoryUseCase',
      new RecordReviewHistoryUseCase(
        this.get('ReviewHistoryRepository'),
        this.get('PlaceRepository')
      )
    );

    this.useCases.set(
      'GetReviewHistoryUseCase',
      new GetReviewHistoryUseCase(
        this.get('ReviewHistoryRepository'),
        this.get('PlaceRepository')
      )
    );

    this.useCases.set(
      'GetLatestReviewStatsUseCase',
      new GetLatestReviewStatsUseCase(
        this.get('ReviewHistoryRepository'),
        this.get('PlaceRepository')
      )
    );

    // Competitor Use Cases
    this.useCases.set(
      'AddCompetitorUseCase',
      new AddCompetitorUseCase(
        this.get('CompetitorRepository'),
        this.get('PlaceRepository')
      )
    );

    this.useCases.set(
      'RecordCompetitorSnapshotUseCase',
      new RecordCompetitorSnapshotUseCase(
        this.get('CompetitorSnapshotRepository'),
        this.get('CompetitorRepository')
      )
    );

    this.useCases.set(
      'GetCompetitorHistoryUseCase',
      new GetCompetitorHistoryUseCase(
        this.get('CompetitorSnapshotRepository'),
        this.get('CompetitorRepository')
      )
    );
  }
}
