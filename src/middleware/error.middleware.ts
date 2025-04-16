import { Request, Response, NextFunction } from "express";

/**
 * Custom application error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default to 500 Internal Server Error if status code is not set
  const statusCode = "statusCode" in err ? err.statusCode : 500;

  // Determine if error is operational (known) or programming error
  const isOperational = "isOperational" in err ? err.isOperational : false;

  // Log error for debugging (use a proper logger in production)
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${err.message}`);
    console.error(err.stack);
  }

  // Prepare response based on environment
  const response = {
    status: "error",
    message: isOperational ? err.message : "An unexpected error occurred",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  // Send response with appropriate status code
  res.status(statusCode).json(response);
};

/**
 * Async error handler wrapper
 * Eliminates need for try/catch blocks in async controllers
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
