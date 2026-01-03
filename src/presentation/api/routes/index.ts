import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import { createAuthRoutes } from './authRoutes';
import { createPlaceRoutes } from './placeRoutes';
import { createKeywordRoutes } from './keywordRoutes';
import { createRankingRoutes } from './rankingRoutes';
import { createReviewRoutes } from './reviewRoutes';
import { createReviewHistoryRoutes } from './reviewHistoryRoutes';
import { createCompetitorRoutes } from './competitorRoutes';
import { createNotificationRoutes } from './notificationRoutes';

/**
 * Create main API router with all routes
 * Each route factory creates its own controller and middleware instances
 */
export function createApiRoutes(container: DIContainer): Router {
  const router = Router();

  // Mount routes - each route factory receives the DI container
  // and creates its own controller and middleware instances
  router.use('/auth', createAuthRoutes(container));
  router.use('/places', createPlaceRoutes(container));
  router.use('/keywords', createKeywordRoutes(container));
  router.use('/rankings', createRankingRoutes(container));
  router.use('/reviews', createReviewRoutes(container));
  router.use('/review-history', createReviewHistoryRoutes(container));
  router.use('/competitors', createCompetitorRoutes(container));
  router.use('/notifications', createNotificationRoutes(container));

  return router;
}
