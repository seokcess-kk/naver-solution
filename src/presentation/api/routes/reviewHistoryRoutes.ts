import { Router } from 'express';
import { ReviewHistoryController } from '../controllers/ReviewHistoryController';
import { validateDto } from '../middleware/validateDto';
import { RecordReviewHistoryDto } from '@application/dtos/tracking/review-history';

export function createReviewHistoryRoutes(controller: ReviewHistoryController): Router {
  const router = Router();

  // POST /api/review-history - Record review history snapshot
  router.post('/', validateDto(RecordReviewHistoryDto), controller.recordReviewHistory);

  // GET /api/review-history/place/:placeId - Get review history for a place
  router.get('/place/:placeId', controller.getReviewHistory);

  // GET /api/review-history/place/:placeId/latest - Get latest review stats
  router.get('/place/:placeId/latest', controller.getLatestReviewStats);

  return router;
}
