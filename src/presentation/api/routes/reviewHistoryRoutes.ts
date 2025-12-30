import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import { ReviewHistoryController } from '../controllers/ReviewHistoryController';
import { validateDto } from '../middleware/validateDto';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { RecordReviewHistoryDto } from '@application/dtos/tracking/review-history';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';

export function createReviewHistoryRoutes(container: DIContainer): Router {
  const router = Router();

  // Create authMiddleware from DI container
  const authMiddleware = createAuthMiddleware(
    container.get('JwtAuthService')
  );

  // Create controller from DI container
  const controller = new ReviewHistoryController(
    container.get('RecordReviewHistoryUseCase'),
    container.get('GetReviewHistoryUseCase'),
    container.get('GetLatestReviewStatsUseCase')
  );

  // All routes require authentication
  // POST /api/review-history - Record review history snapshot
  router.post('/', authMiddleware, validateDto(RecordReviewHistoryDto), controller.recordReviewHistory);

  // GET /api/review-history/place/:placeId - Get review history for a place
  router.get('/place/:placeId', authMiddleware, controller.getReviewHistory);

  // GET /api/review-history/place/:placeId/latest - Get latest review stats
  router.get('/place/:placeId/latest', authMiddleware, controller.getLatestReviewStats);

  return router;
}
