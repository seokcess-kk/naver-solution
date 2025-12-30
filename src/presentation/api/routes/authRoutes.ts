import { Router } from 'express';
import { DIContainer } from '../config/DIContainer';
import { AuthController } from '../controllers/AuthController';
import { validateDto } from '../middleware/validateDto';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import {
  RegisterUserDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
} from '@application/dtos/auth';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';

export function createAuthRoutes(container: DIContainer): Router {
  const router = Router();

  // Create authMiddleware from DI container
  const authMiddleware = createAuthMiddleware(
    container.get('JwtAuthService')
  );

  // Create controller from DI container
  const controller = new AuthController(
    container.get('RegisterUserUseCase'),
    container.get('LoginUseCase'),
    container.get('RefreshTokenUseCase'),
    container.get('GetUserProfileUseCase'),
    container.get('LogoutUseCase')
  );

  // Public routes
  router.post('/register', validateDto(RegisterUserDto), controller.register);
  router.post('/login', validateDto(LoginRequestDto), controller.login);
  router.post(
    '/refresh',
    validateDto(RefreshTokenRequestDto),
    controller.refreshToken
  );

  // Protected routes (require authentication)
  router.get('/profile', authMiddleware, controller.getProfile);
  router.post('/logout', authMiddleware, controller.logout);

  return router;
}
