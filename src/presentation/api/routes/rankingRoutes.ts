import { Router } from 'express';
import { RankingController } from '../controllers/RankingController';
import { validateDto } from '../middleware/validateDto';
import { RecordRankingDto } from '@application/dtos/tracking/ranking';

export function createRankingRoutes(controller: RankingController): Router {
  const router = Router();

  // POST /api/rankings - Record a new ranking
  router.post('/', validateDto(RecordRankingDto), controller.recordRanking);

  // GET /api/rankings/history - Get ranking history for a place-keyword
  router.get('/history', controller.getRankingHistory);

  // GET /api/rankings/latest/:placeKeywordId - Get latest ranking
  router.get('/latest/:placeKeywordId', controller.getLatestRanking);

  return router;
}
