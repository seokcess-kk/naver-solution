import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import { RankingController } from '../controllers/RankingController';
import { validateDto } from '../middleware/validateDto';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { RecordRankingDto, ScrapeRankingDto } from '@application/dtos/tracking/ranking';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';

export function createRankingRoutes(container: DIContainer): Router {
  const router = Router();

  // Create authMiddleware from DI container
  const authMiddleware = createAuthMiddleware(
    container.get('JwtAuthService')
  );

  // Create controller from DI container
  const controller = new RankingController(
    container.get('RecordRankingUseCase'),
    container.get('GetRankingHistoryUseCase'),
    container.get('GetLatestRankingUseCase'),
    container.get('ScrapeRankingUseCase')
  );

  // All routes require authentication
  // POST /api/rankings - Record a new ranking
  router.post('/', authMiddleware, validateDto(RecordRankingDto), controller.recordRanking);

  // POST /api/rankings/scrape - Trigger Naver scraping
  router.post('/scrape', authMiddleware, validateDto(ScrapeRankingDto), controller.scrapeRanking);

  // GET /api/rankings/history - Get ranking history for a place-keyword
  router.get('/history', authMiddleware, controller.getRankingHistory);

  // GET /api/rankings/latest/:placeKeywordId - Get latest ranking
  router.get('/latest/:placeKeywordId', authMiddleware, controller.getLatestRanking);

  return router;
}
