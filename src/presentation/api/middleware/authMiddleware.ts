import { Request, Response, NextFunction } from 'express';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';
import { UnauthorizedError } from '@application/errors/HttpError';

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

/**
 * Factory function to create authentication middleware
 * @param jwtService - JWT service from DI container
 * @returns Middleware function that verifies JWT access token and sets req.user
 */
export function createAuthMiddleware(jwtService: IJwtAuthService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 1. Extract Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('No authorization header provided');
      }

      // 2. Extract Bearer token
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedError('Invalid authorization header format');
      }

      const token = parts[1];

      // 3. Verify token using injected service
      const decoded = jwtService.verifyAccessToken(token);

      // 4. Set user in request
      req.user = { userId: decoded.userId };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        next(error);
      } else {
        next(new UnauthorizedError('Invalid or expired token'));
      }
    }
  };
}
