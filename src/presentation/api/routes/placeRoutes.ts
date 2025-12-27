import { Router } from 'express';
import { PlaceController } from '../controllers/PlaceController';
import { validateDto } from '../middleware/validateDto';
import { CreatePlaceDto, UpdatePlaceDto } from '@application/dtos/place';

export function createPlaceRoutes(controller: PlaceController): Router {
  const router = Router();

  // POST /api/places - Create a new place
  router.post('/', validateDto(CreatePlaceDto), controller.createPlace);

  // GET /api/places - List all places for a user (query param: userId)
  router.get('/', controller.listPlaces);

  // GET /api/places/:id - Get a single place
  router.get('/:id', controller.getPlace);

  // PUT /api/places/:id - Update a place
  router.put('/:id', validateDto(UpdatePlaceDto), controller.updatePlace);

  // PATCH /api/places/:id/status - Update place active status
  router.patch('/:id/status', controller.updatePlaceActiveStatus);

  // DELETE /api/places/:id - Delete a place
  router.delete('/:id', controller.deletePlace);

  return router;
}
