// Repository Interfaces
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

// Service Interfaces
import { IPasswordHashService } from '@domain/services/IPasswordHashService';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';
import { INaverScrapingService } from '@infrastructure/naver/interfaces/INaverScrapingService';

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
import { GetPlaceCompetitorsUseCase } from '@application/usecases/tracking/competitor/GetPlaceCompetitorsUseCase';

// Auth Use Cases
import {
  RegisterUserUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
  GetUserProfileUseCase,
  LogoutUseCase,
  UpdateUserProfileUseCase,
  ChangePasswordUseCase,
} from '@application/usecases/auth';

// Notification Use Cases
import {
  GetUserNotificationSettingsUseCase,
  CreateNotificationSettingUseCase,
  UpdateNotificationSettingUseCase,
  DeleteNotificationSettingUseCase,
  GetNotificationLogsUseCase,
} from '@application/usecases/notification';

/**
 * Service Registry Interface
 * Defines all services available in the DI Container with their types.
 * This enables compile-time type checking and IDE autocomplete for service names.
 */
export interface ServiceRegistry {
  // ============================================
  // Repositories
  // ============================================
  UserRepository: IUserRepository;
  PlaceRepository: IPlaceRepository;
  KeywordRepository: IKeywordRepository;
  PlaceKeywordRepository: IPlaceKeywordRepository;
  RankingHistoryRepository: IRankingHistoryRepository;
  ReviewHistoryRepository: IReviewHistoryRepository;
  ReviewRepository: IReviewRepository;
  CompetitorRepository: ICompetitorRepository;
  CompetitorSnapshotRepository: ICompetitorSnapshotRepository;
  NotificationSettingRepository: INotificationSettingRepository;
  NotificationLogRepository: INotificationLogRepository;
  RefreshTokenRepository: IRefreshTokenRepository;

  // ============================================
  // Infrastructure Services
  // ============================================
  PasswordHashService: IPasswordHashService;
  JwtAuthService: IJwtAuthService;
  NaverScrapingService: INaverScrapingService;

  // ============================================
  // Place Use Cases
  // ============================================
  CreatePlaceUseCase: CreatePlaceUseCase;
  GetPlaceUseCase: GetPlaceUseCase;
  ListPlacesUseCase: ListPlacesUseCase;
  UpdatePlaceUseCase: UpdatePlaceUseCase;
  UpdatePlaceActiveStatusUseCase: UpdatePlaceActiveStatusUseCase;
  DeletePlaceUseCase: DeletePlaceUseCase;
  GetPlaceStatsUseCase: GetPlaceStatsUseCase;

  // ============================================
  // Keyword Use Cases
  // ============================================
  ListKeywordsUseCase: ListKeywordsUseCase;
  GetPlaceKeywordsUseCase: GetPlaceKeywordsUseCase;
  AddPlaceKeywordUseCase: AddPlaceKeywordUseCase;
  RemovePlaceKeywordUseCase: RemovePlaceKeywordUseCase;

  // ============================================
  // Ranking Use Cases
  // ============================================
  RecordRankingUseCase: RecordRankingUseCase;
  GetRankingHistoryUseCase: GetRankingHistoryUseCase;
  GetLatestRankingUseCase: GetLatestRankingUseCase;
  ScrapeRankingUseCase: ScrapeRankingUseCase;

  // ============================================
  // Review Use Cases
  // ============================================
  RecordReviewUseCase: RecordReviewUseCase;
  GetPlaceReviewsUseCase: GetPlaceReviewsUseCase;
  GetReviewsBySentimentUseCase: GetReviewsBySentimentUseCase;
  ScrapeReviewsUseCase: ScrapeReviewsUseCase;

  // ============================================
  // Review History Use Cases
  // ============================================
  RecordReviewHistoryUseCase: RecordReviewHistoryUseCase;
  GetReviewHistoryUseCase: GetReviewHistoryUseCase;
  GetLatestReviewStatsUseCase: GetLatestReviewStatsUseCase;

  // ============================================
  // Competitor Use Cases
  // ============================================
  AddCompetitorUseCase: AddCompetitorUseCase;
  RecordCompetitorSnapshotUseCase: RecordCompetitorSnapshotUseCase;
  GetCompetitorHistoryUseCase: GetCompetitorHistoryUseCase;
  GetPlaceCompetitorsUseCase: GetPlaceCompetitorsUseCase;

  // ============================================
  // Auth Use Cases
  // ============================================
  RegisterUserUseCase: RegisterUserUseCase;
  LoginUseCase: LoginUseCase;
  RefreshTokenUseCase: RefreshTokenUseCase;
  GetUserProfileUseCase: GetUserProfileUseCase;
  LogoutUseCase: LogoutUseCase;
  UpdateUserProfileUseCase: UpdateUserProfileUseCase;
  ChangePasswordUseCase: ChangePasswordUseCase;

  // ============================================
  // Notification Use Cases
  // ============================================
  GetUserNotificationSettingsUseCase: GetUserNotificationSettingsUseCase;
  CreateNotificationSettingUseCase: CreateNotificationSettingUseCase;
  UpdateNotificationSettingUseCase: UpdateNotificationSettingUseCase;
  DeleteNotificationSettingUseCase: DeleteNotificationSettingUseCase;
  GetNotificationLogsUseCase: GetNotificationLogsUseCase;
}

/**
 * Service Name Type
 * Union type of all valid service names in the registry.
 * Used for compile-time validation of service names.
 */
export type ServiceName = keyof ServiceRegistry;
