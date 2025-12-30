import { Request, Response, NextFunction } from 'express';
import { HttpError, ValidationError } from '@application/errors/HttpError';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; errors: string[] }>;
    stack?: string;
  };
  timestamp: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: Array<{ field: string; errors: string[] }> | undefined;

  // Handle HttpError and its subclasses
  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    code = err.name;
    message = err.message;

    // Include validation details if it's a ValidationError
    if (err instanceof ValidationError) {
      details = err.details;
    }
  }

  // Log error for monitoring (in production, you'd use a proper logger)
  if (!isDevelopment || statusCode >= 500) {
    console.error('[Error Handler]', {
      code,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(isDevelopment && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(errorResponse);
};
