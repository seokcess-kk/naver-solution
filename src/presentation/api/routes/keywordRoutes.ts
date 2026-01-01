import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import { KeywordController } from '../controllers/KeywordController';
import { validateDto } from '../middleware/validateDto';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { AddPlaceKeywordDto } from '@application/dtos/keyword';

export function createKeywordRoutes(container: DIContainer): Router {
  const router = Router();

  // Create authMiddleware from DI container
  const authMiddleware = createAuthMiddleware(
    container.get('JwtAuthService')
  );

  // Create controller from DI container
  const controller = new KeywordController(
    container.get('ListKeywordsUseCase'),
    container.get('GetPlaceKeywordsUseCase'),
    container.get('AddPlaceKeywordUseCase'),
    container.get('RemovePlaceKeywordUseCase')
  );

  // All routes require authentication

  // GET /api/keywords - List all keywords
  router.get('/', authMiddleware, controller.listKeywords);

  // GET /api/keywords/place/:placeId - Get keywords for a specific place
  router.get('/place/:placeId', authMiddleware, controller.getPlaceKeywords);

  // POST /api/keywords/place - Add a keyword to a place
  router.post(
    '/place',
    authMiddleware,
    validateDto(AddPlaceKeywordDto),
    controller.addPlaceKeyword
  );

  // DELETE /api/keywords/place/:placeKeywordId - Remove a keyword from a place
  router.delete('/place/:placeKeywordId', authMiddleware, controller.removePlaceKeyword);

  return router;
}
