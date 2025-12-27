import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import {
  PlaceController,
  RankingController,
  ReviewController,
  ReviewHistoryController,
  CompetitorController,
} from '../controllers';
import { createPlaceRoutes } from './placeRoutes';
import { createRankingRoutes } from './rankingRoutes';
import { createReviewRoutes } from './reviewRoutes';
import { createReviewHistoryRoutes } from './reviewHistoryRoutes';
import { createCompetitorRoutes } from './competitorRoutes';

/**
 * Create main API router with all routes
 */
export function createApiRoutes(container: DIContainer): Router {
  const router = Router();

  // Initialize controllers from DI container
  const placeController = new PlaceController(
    container.get('CreatePlaceUseCase'),
    container.get('GetPlaceUseCase'),
    container.get('ListPlacesUseCase'),
    container.get('UpdatePlaceUseCase'),
    container.get('UpdatePlaceActiveStatusUseCase'),
    container.get('DeletePlaceUseCase')
  );

  const rankingController = new RankingController(
    container.get('RecordRankingUseCase'),
    container.get('GetRankingHistoryUseCase'),
    container.get('GetLatestRankingUseCase')
  );

  const reviewController = new ReviewController(
    container.get('RecordReviewUseCase'),
    container.get('GetPlaceReviewsUseCase'),
    container.get('GetReviewsBySentimentUseCase')
  );

  const reviewHistoryController = new ReviewHistoryController(
    container.get('RecordReviewHistoryUseCase'),
    container.get('GetReviewHistoryUseCase'),
    container.get('GetLatestReviewStatsUseCase')
  );

  const competitorController = new CompetitorController(
    container.get('AddCompetitorUseCase'),
    container.get('RecordCompetitorSnapshotUseCase'),
    container.get('GetCompetitorHistoryUseCase')
  );

  // Mount routes
  router.use('/places', createPlaceRoutes(placeController));
  router.use('/rankings', createRankingRoutes(rankingController));
  router.use('/reviews', createReviewRoutes(reviewController));
  router.use('/review-history', createReviewHistoryRoutes(reviewHistoryController));
  router.use('/competitors', createCompetitorRoutes(competitorController));

  return router;
}
