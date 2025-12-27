import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController';
import { validateDto } from '../middleware/validateDto';
import { RecordReviewDto } from '@application/dtos/tracking/review';

export function createReviewRoutes(controller: ReviewController): Router {
  const router = Router();

  // POST /api/reviews - Record a new review
  router.post('/', validateDto(RecordReviewDto), controller.recordReview);

  // GET /api/reviews/place/:placeId - Get all reviews for a place
  router.get('/place/:placeId', controller.getPlaceReviews);

  // GET /api/reviews/place/:placeId/sentiment/:sentiment - Get reviews by sentiment
  router.get('/place/:placeId/sentiment/:sentiment', controller.getReviewsBySentiment);

  return router;
}
