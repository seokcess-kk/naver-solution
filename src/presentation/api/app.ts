import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { DIContainer } from './config/DIContainer';
import { createApiRoutes } from './routes';

/**
 * Create and configure Express application
 *
 * @param container - Dependency injection container
 * @returns Configured Express application
 */
export function createApp(container: DIContainer): Application {
  const app: Application = express();

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use(requestLogger);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Mount API routes
  app.use('/api', createApiRoutes(container));

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
