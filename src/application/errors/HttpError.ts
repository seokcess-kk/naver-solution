/**
 * Base HTTP Error Class
 * Provides structured error handling with operational flag
 */
export class HttpError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public readonly statusCode: number,
    message: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Resource already exists') {
    super(409, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad request') {
    super(400, message);
  }
}

export class ValidationError extends HttpError {
  constructor(
    message: string = 'Validation failed',
    public readonly details?: Array<{ field: string; errors: string[] }>
  ) {
    super(400, message);
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error') {
    super(500, message, false);
  }
}
