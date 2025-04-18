"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = exports.errorHandler = exports.AppError = void 0;
/**
 * Custom application error class with status code
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
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
    const response = Object.assign({ status: "error", message: isOperational ? err.message : "An unexpected error occurred" }, (process.env.NODE_ENV === "development" && { stack: err.stack }));
    // Send response with appropriate status code
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/**
 * Async error handler wrapper
 * Eliminates need for try/catch blocks in async controllers
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.catchAsync = catchAsync;
