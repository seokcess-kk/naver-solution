import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 * Logs HTTP method, path, status code, and response time
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    }
  });

  next();
};
