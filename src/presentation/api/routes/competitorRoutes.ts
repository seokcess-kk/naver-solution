import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import { CompetitorController } from '../controllers/CompetitorController';
import { validateDto } from '../middleware/validateDto';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { AddCompetitorDto, RecordCompetitorSnapshotDto } from '@application/dtos/tracking/competitor';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';

export function createCompetitorRoutes(container: DIContainer): Router {
  const router = Router();

  // Create authMiddleware from DI container
  const authMiddleware = createAuthMiddleware(
    container.get('JwtAuthService')
  );

  // Create controller from DI container
  const controller = new CompetitorController(
    container.get('AddCompetitorUseCase'),
    container.get('RecordCompetitorSnapshotUseCase'),
    container.get('GetCompetitorHistoryUseCase')
  );

  // All routes require authentication
  // POST /api/competitors - Add a new competitor
  router.post('/', authMiddleware, validateDto(AddCompetitorDto), controller.addCompetitor);

  // POST /api/competitors/snapshots - Record competitor snapshot
  router.post('/snapshots', authMiddleware, validateDto(RecordCompetitorSnapshotDto), controller.recordCompetitorSnapshot);

  // GET /api/competitors/:competitorId/history - Get competitor history
  router.get('/:competitorId/history', authMiddleware, controller.getCompetitorHistory);

  return router;
}
