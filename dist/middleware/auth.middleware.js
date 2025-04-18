"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("./error.middleware");
// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new error_middleware_1.AppError("Authentication token required", 401);
        }
        // Extract token from "Bearer <token>"
        const token = authHeader.split(" ")[1];
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Add user info to request object
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new error_middleware_1.AppError("Invalid token", 401));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new error_middleware_1.AppError("Token expired", 401));
        }
        next(error);
    }
};
exports.authenticate = authenticate;
