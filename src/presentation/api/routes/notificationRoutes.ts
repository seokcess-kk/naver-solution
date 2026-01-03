import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import { NotificationController } from '../controllers/NotificationController';
import { validateDto } from '../middleware/validateDto';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { CreateNotificationSettingDto, UpdateNotificationSettingDto } from '@application/dtos/notification';

export function createNotificationRoutes(container: DIContainer): Router {
  const router = Router();

  // Create authMiddleware from DI container
  const authMiddleware = createAuthMiddleware(
    container.get('JwtAuthService')
  );

  // Create controller from DI container
  const controller = new NotificationController(
    container.get('GetUserNotificationSettingsUseCase'),
    container.get('CreateNotificationSettingUseCase'),
    container.get('UpdateNotificationSettingUseCase'),
    container.get('DeleteNotificationSettingUseCase'),
    container.get('GetNotificationLogsUseCase')
  );

  // All routes require authentication
  // GET /api/notifications/settings/user/:userId - Get user's notification settings
  router.get('/settings/user/:userId', authMiddleware, controller.getUserSettings);

  // POST /api/notifications/settings - Create notification setting
  router.post('/settings', authMiddleware, validateDto(CreateNotificationSettingDto), controller.createSetting);

  // PATCH /api/notifications/settings/:id - Update notification setting
  router.patch('/settings/:id', authMiddleware, validateDto(UpdateNotificationSettingDto), controller.updateSetting);

  // DELETE /api/notifications/settings/:id - Delete notification setting
  router.delete('/settings/:id', authMiddleware, controller.deleteSetting);

  // GET /api/notifications/logs/place/:placeId - Get place notification logs
  router.get('/logs/place/:placeId', authMiddleware, controller.getPlaceLogs);

  return router;
}
