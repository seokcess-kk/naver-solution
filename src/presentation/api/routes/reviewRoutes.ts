import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import { ReviewController } from '../controllers/ReviewController';
import { validateDto } from '../middleware/validateDto';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { RecordReviewDto, ScrapeReviewsDto } from '@application/dtos/tracking/review';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';

export function createReviewRoutes(container: DIContainer): Router {
  const router = Router();

  // Create authMiddleware from DI container
  const authMiddleware = createAuthMiddleware(
    container.get('JwtAuthService')
  );

  // Create controller from DI container
  const controller = new ReviewController(
    container.get('RecordReviewUseCase'),
    container.get('GetPlaceReviewsUseCase'),
    container.get('GetReviewsBySentimentUseCase'),
    container.get('ScrapeReviewsUseCase')
  );

  // All routes require authentication
  // POST /api/reviews - Record a new review
  router.post('/', authMiddleware, validateDto(RecordReviewDto), controller.recordReview);

  // POST /api/reviews/scrape - Trigger Naver scraping
  router.post('/scrape', authMiddleware, validateDto(ScrapeReviewsDto), controller.scrapeReviews);

  // GET /api/reviews/place/:placeId - Get all reviews for a place
  router.get('/place/:placeId', authMiddleware, controller.getPlaceReviews);

  // GET /api/reviews/place/:placeId/sentiment/:sentiment - Get reviews by sentiment
  router.get('/place/:placeId/sentiment/:sentiment', authMiddleware, controller.getReviewsBySentiment);

  return router;
}
