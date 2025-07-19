import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES } from '../constants/errorCodes';

interface ErrorResponse {
  error: string;
  message: string;
  stackTrace?: string;
}

const errorHandler = (
  err: Error & { statusCode?: number; stackTrace?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = res.statusCode || err.statusCode || ERROR_CODES.SERVER_ERROR;
  
  const errorResponse: ErrorResponse = {
    error: 'Server Error',
    message: err.message || 'An unexpected error occurred',
  };

  // Only include stackTrace in development mode
  if (process.env['NODE_ENV'] === 'development') {
    const stackTrace = err.stackTrace || err.stack;
    if (stackTrace) {
      errorResponse.stackTrace = stackTrace;
    }
  }

  switch (statusCode) {
    case ERROR_CODES.VALIDATION_ERROR:
      errorResponse.error = 'Validation Failed';
      break;
    case ERROR_CODES.NOT_FOUND:
      errorResponse.error = 'Not Found';
      break;
    case ERROR_CODES.UNAUTHORIZED:
      errorResponse.error = 'Unauthorized';
      break;
    case ERROR_CODES.SERVER_ERROR:
      errorResponse.error = 'Server Error';
      break;
    case ERROR_CODES.FORBIDDEN:
      errorResponse.error = 'Forbidden';
      break;
    default:
      errorResponse.error = 'All Good!';
      break;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler; 