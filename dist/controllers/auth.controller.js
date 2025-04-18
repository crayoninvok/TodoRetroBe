"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_service_1 = require("../services/email.service");
const error_middleware_1 = require("../middleware/error.middleware");
// Environment variables for JWT
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
class AuthController {
    /**
     * Register a new user
     */
    register(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, name } = req.body;
                console.log("Registration attempt:", { email, name });
                // Check if user already exists
                const existingUser = yield prisma_1.default.user.findUnique({
                    where: { email },
                });
                if (existingUser) {
                    console.log("User already exists:", email);
                    return res.status(400).json({ message: "User already exists" });
                }
                // Hash password
                const salt = yield bcrypt_1.default.genSalt(10);
                const hashedPassword = yield bcrypt_1.default.hash(password, salt);
                console.log("Password hashed successfully");
                // Create user
                let user;
                try {
                    user = yield prisma_1.default.user.create({
                        data: {
                            email,
                            password: hashedPassword,
                            name,
                            isEmailVerified: false,
                        },
                    });
                    console.log("User created successfully:", user.id);
                }
                catch (dbError) {
                    console.error("Database error creating user:", dbError);
                    return res.status(500).json({ message: "Error creating user" });
                }
                try {
                    // Generate verification token and send email
                    const verificationToken = yield (0, email_service_1.generateVerificationToken)(user.id);
                    console.log("Verification token generated:", verificationToken);
                    yield (0, email_service_1.sendVerificationEmail)(user.email, user.name, verificationToken);
                    console.log("Verification email sent");
                }
                catch (emailError) {
                    console.error("Email service error:", emailError);
                    // Don't fail the request if email sending fails
                    // Just log it and return success anyway
                }
                // Return user info (without tokens until email is verified)
                res.status(201).json({
                    message: "User registered successfully. Please check your email to verify your account.",
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    },
                });
            }
            catch (error) {
                console.error("Registration error:", error);
                next(error);
            }
        });
    }
    /**
     * Verify user email address
     */
    /**
     * Verify user email address
     */
    verifyEmail(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token } = req.query;
                console.log("Verification attempt with token:", token);
                if (!token || typeof token !== "string") {
                    console.log("Invalid token format:", token);
                    return res.status(400).json({ message: "Invalid verification token" });
                }
                // Step 1: Try to find a user with this token
                const user = yield prisma_1.default.user.findFirst({
                    where: {
                        verificationToken: token,
                    },
                });
                if (!user) {
                    console.log("Token not found:", token);
                    // Step 2: Since token not found, check if it might have been used already
                    // Try to find recently verified users (verified in the last 24 hours)
                    // This is a heuristic approach since we don't store token history
                    const recentlyVerified = yield prisma_1.default.user.findMany({
                        where: {
                            isEmailVerified: true,
                            updatedAt: {
                                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                            },
                            verificationToken: null, // Token was cleared
                        },
                    });
                    if (recentlyVerified.length > 0) {
                        // If we found recently verified users, it's likely this token was already used
                        return res.status(200).json({
                            message: "Your email has already been verified. You can log in now.",
                        });
                    }
                    // If no recently verified users, this is likely an invalid token
                    return res.status(400).json({
                        message: "Invalid verification token. Please request a new verification email.",
                    });
                }
                // Token is valid, now check if already verified
                if (user.isEmailVerified) {
                    console.log("Email already verified for user:", user.id);
                    return res.status(200).json({
                        message: "Your email is already verified. You can log in.",
                    });
                }
                // Check if token has expired
                if (user.verificationExpires && user.verificationExpires < new Date()) {
                    console.log("Token expired for user:", user.id);
                    return res.status(400).json({
                        message: "Verification token has expired. Please request a new verification email.",
                    });
                }
                console.log("Valid token found for user:", user.id);
                // Mark email as verified and remove verification token
                yield prisma_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        isEmailVerified: true,
                        verificationToken: null,
                        verificationExpires: null,
                    },
                });
                console.log("User verified successfully:", user.id);
                // Return a success message for API requests
                return res
                    .status(200)
                    .json({ message: "Email verified successfully. You can now log in." });
            }
            catch (error) {
                console.error("Verification error:", error);
                next(error);
            }
        });
    }
    /**
     * Resend verification email
     */
    resendVerificationEmail(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                // Find user by email
                const user = yield prisma_1.default.user.findUnique({
                    where: { email },
                });
                // Don't reveal if user exists or not
                if (!user) {
                    return res.status(200).json({
                        message: "If your email exists in our system, a verification email will be sent shortly.",
                    });
                }
                // If already verified
                if (user.isEmailVerified) {
                    return res
                        .status(200)
                        .json({ message: "Your email is already verified. You can log in." });
                }
                // Generate new verification token and send email
                const verificationToken = yield (0, email_service_1.generateVerificationToken)(user.id);
                yield (0, email_service_1.sendVerificationEmail)(user.email, user.name, verificationToken);
                res.status(200).json({
                    message: "If your email exists in our system, a verification email will be sent shortly.",
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Login user
     */
    login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                // Find user
                const user = yield prisma_1.default.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    return res.status(401).json({ message: "Invalid credentials" });
                }
                // Verify password
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({ message: "Invalid credentials" });
                }
                // Check if email is verified
                if (!user.isEmailVerified) {
                    // Generate a new verification token and send email again
                    const verificationToken = yield (0, email_service_1.generateVerificationToken)(user.id);
                    yield (0, email_service_1.sendVerificationEmail)(user.email, user.name, verificationToken);
                    return res.status(403).json({
                        message: "Email not verified. A new verification email has been sent to your email address.",
                    });
                }
                // Generate tokens
                const accessToken = this.generateAccessToken(user.id);
                const refreshToken = this.generateRefreshToken(user.id);
                // Save refresh token to database
                yield prisma_1.default.user.update({
                    where: { id: user.id },
                    data: { refreshToken },
                });
                // Return user info and tokens
                res.status(200).json({
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    },
                    accessToken,
                    refreshToken,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Refresh access token
     */
    refreshToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return res.status(401).json({ message: "Refresh token required" });
                }
                // Verify refresh token
                try {
                    const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
                    // Find user with this refresh token
                    const user = yield prisma_1.default.user.findFirst({
                        where: {
                            id: decoded.userId,
                            refreshToken: refreshToken,
                        },
                    });
                    if (!user) {
                        return res.status(403).json({ message: "Invalid refresh token" });
                    }
                    // Generate new tokens
                    const newAccessToken = this.generateAccessToken(user.id);
                    const newRefreshToken = this.generateRefreshToken(user.id);
                    // Update refresh token in database
                    yield prisma_1.default.user.update({
                        where: { id: user.id },
                        data: { refreshToken: newRefreshToken },
                    });
                    res.status(200).json({
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                    });
                }
                catch (error) {
                    return res.status(403).json({ message: "Invalid refresh token" });
                }
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Logout user
     */
    logout(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return res.status(400).json({ message: "Refresh token required" });
                }
                // Find user with this refresh token and clear it
                yield prisma_1.default.user.updateMany({
                    where: { refreshToken },
                    data: { refreshToken: null },
                });
                res.status(200).json({ message: "Logout successful" });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get current user profile
     */
    getProfile(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // req.user is set in the auth middleware
                const userId = req.user.userId;
                const user = yield prisma_1.default.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        createdAt: true,
                        updatedAt: true,
                        isEmailVerified: true,
                    },
                });
                if (!user) {
                    throw new error_middleware_1.AppError("User not found", 404);
                }
                res.status(200).json({ user });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Request password reset
     */
    requestPasswordReset(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                // Find user by email
                const user = yield prisma_1.default.user.findUnique({
                    where: { email },
                });
                // Always return success, even if user doesn't exist (for security)
                if (!user) {
                    return res.status(200).json({
                        message: "If your email exists in our system, you will receive a password reset link shortly.",
                    });
                }
                // Generate reset token and send email
                const resetToken = yield (0, email_service_1.generatePasswordResetToken)(user.id);
                yield (0, email_service_1.sendPasswordResetEmail)(user.email, user.name, resetToken);
                res.status(200).json({
                    message: "If your email exists in our system, you will receive a password reset link shortly.",
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Reset password
     */
    resetPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token, newPassword } = req.body;
                if (!token || !newPassword) {
                    return res
                        .status(400)
                        .json({ message: "Token and new password are required" });
                }
                // Find user with this reset token
                const user = yield prisma_1.default.user.findFirst({
                    where: {
                        passwordResetToken: token,
                        passwordResetExpires: {
                            gt: new Date(), // Ensure token hasn't expired
                        },
                    },
                });
                if (!user) {
                    return res
                        .status(400)
                        .json({ message: "Invalid or expired reset token" });
                }
                // Hash new password
                const salt = yield bcrypt_1.default.genSalt(10);
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, salt);
                // Update password and clear reset token
                yield prisma_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        password: hashedPassword,
                        passwordResetToken: null,
                        passwordResetExpires: null,
                    },
                });
                res.status(200).json({
                    message: "Password reset successful. You can now log in with your new password.",
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Generate access token
     */
    generateAccessToken(userId) {
        const options = { expiresIn: JWT_EXPIRES_IN };
        return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, options);
    }
    /**
     * Generate refresh token
     */
    generateRefreshToken(userId) {
        const options = { expiresIn: JWT_REFRESH_EXPIRES_IN };
        return jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, options);
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
