import { Router } from 'express';
import { CompetitorController } from '../controllers/CompetitorController';
import { validateDto } from '../middleware/validateDto';
import { AddCompetitorDto, RecordCompetitorSnapshotDto } from '@application/dtos/tracking/competitor';

export function createCompetitorRoutes(controller: CompetitorController): Router {
  const router = Router();

  // POST /api/competitors - Add a new competitor
  router.post('/', validateDto(AddCompetitorDto), controller.addCompetitor);

  // POST /api/competitors/snapshots - Record competitor snapshot
  router.post('/snapshots', validateDto(RecordCompetitorSnapshotDto), controller.recordCompetitorSnapshot);

  // GET /api/competitors/:competitorId/history - Get competitor history
  router.get('/:competitorId/history', controller.getCompetitorHistory);

  return router;
}
