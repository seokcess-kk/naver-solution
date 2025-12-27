export class ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  details?: any;

  constructor(statusCode: number, message: string, error?: string, details?: any) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.details = details;
  }

  static notFound(message: string): ErrorResponse {
    return new ErrorResponse(404, message, 'Not Found');
  }

  static badRequest(message: string, details?: any): ErrorResponse {
    return new ErrorResponse(400, message, 'Bad Request', details);
  }

  static conflict(message: string): ErrorResponse {
    return new ErrorResponse(409, message, 'Conflict');
  }

  static unauthorized(message: string): ErrorResponse {
    return new ErrorResponse(401, message, 'Unauthorized');
  }

  static forbidden(message: string): ErrorResponse {
    return new ErrorResponse(403, message, 'Forbidden');
  }

  static internalError(message: string): ErrorResponse {
    return new ErrorResponse(500, message, 'Internal Server Error');
  }
}
