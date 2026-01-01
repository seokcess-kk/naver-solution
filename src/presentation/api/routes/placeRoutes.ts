import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import { PlaceController } from '../controllers/PlaceController';
import { validateDto } from '../middleware/validateDto';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { CreatePlaceDto, UpdatePlaceDto } from '@application/dtos/place';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';

export function createPlaceRoutes(container: DIContainer): Router {
  const router = Router();

  // Create authMiddleware from DI container
  const authMiddleware = createAuthMiddleware(
    container.get('JwtAuthService')
  );

  // Create controller from DI container
  const controller = new PlaceController(
    container.get('CreatePlaceUseCase'),
    container.get('GetPlaceUseCase'),
    container.get('ListPlacesUseCase'),
    container.get('UpdatePlaceUseCase'),
    container.get('UpdatePlaceActiveStatusUseCase'),
    container.get('DeletePlaceUseCase'),
    container.get('GetPlaceStatsUseCase')
  );

  // All routes require authentication
  // POST /api/places - Create a new place
  router.post('/', authMiddleware, validateDto(CreatePlaceDto), controller.createPlace);

  // GET /api/places/stats - Get place statistics
  router.get('/stats', authMiddleware, controller.getPlaceStats);

  // GET /api/places - List all places for a user
  router.get('/', authMiddleware, controller.listPlaces);

  // GET /api/places/:id - Get a single place
  router.get('/:id', authMiddleware, controller.getPlace);

  // PUT /api/places/:id - Update a place
  router.put('/:id', authMiddleware, validateDto(UpdatePlaceDto), controller.updatePlace);

  // PATCH /api/places/:id/status - Update place active status
  router.patch('/:id/status', authMiddleware, controller.updatePlaceActiveStatus);

  // DELETE /api/places/:id - Delete a place
  router.delete('/:id', authMiddleware, controller.deletePlace);

  return router;
}
