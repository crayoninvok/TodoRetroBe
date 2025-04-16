import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import {
  generateVerificationToken,
  sendVerificationEmail,
  generatePasswordResetToken,
  sendPasswordResetEmail,
} from "../services/email.service";
import { AppError } from "../middleware/error.middleware";

// Environment variables for JWT
const JWT_SECRET: Secret = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET: Secret =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Register a new user
 *
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isEmailVerified: false,
      },
    });

    // Generate verification token and send email
    const verificationToken = await generateVerificationToken(user.id);
    await sendVerificationEmail(user.email, user.name, verificationToken);

    // Return user info (without tokens until email is verified)
    res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email address
 *
 * @route GET /api/auth/verify-email
 * @access Public
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gt: new Date(), // Ensure token hasn't expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired verification token. Please request a new verification email.",
      });
    }

    // Mark email as verified and remove verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });
    // For API requests, return a success message
    if (req.headers["accept"] === "application/json") {
      return res
        .status(200)
        .json({ message: "Email verified successfully. You can now log in." });
    }

    // For browser requests, redirect to login page
    res.redirect(`${FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 *
 * @route POST /api/auth/resend-verification
 * @access Public
 */
export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not
    if (!user) {
      return res.status(200).json({
        message:
          "If your email exists in our system, a verification email will be sent shortly.",
      });
    }

    // If already verified
    if (user.isEmailVerified) {
      return res
        .status(200)
        .json({ message: "Your email is already verified. You can log in." });
    }

    // Generate new verification token and send email
    const verificationToken = await generateVerificationToken(user.id);
    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(200).json({
      message:
        "If your email exists in our system, a verification email will be sent shortly.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 *
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Generate a new verification token and send email again
      const verificationToken = await generateVerificationToken(user.id);
      await sendVerificationEmail(user.email, user.name, verificationToken);

      return res.status(403).json({
        message:
          "Email not verified. A new verification email has been sent to your email address.",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to database
    await prisma.user.update({
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
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 *
 * @route POST /api/auth/refresh-token
 * @access Public
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
        userId: string;
      };

      // Find user with this refresh token
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          refreshToken: refreshToken,
        },
      });

      if (!user) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);

      // Update refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 *
 * @route POST /api/auth/logout
 * @access Public
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    // Find user with this refresh token and clear it
    await prisma.user.updateMany({
      where: { refreshToken },
      data: { refreshToken: null },
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 *
 * @route GET /api/auth/profile
 * @access Private
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.user is set in the auth middleware
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
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
      throw new AppError("User not found", 404);
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 *
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success, even if user doesn't exist (for security)
    if (!user) {
      return res.status(200).json({
        message:
          "If your email exists in our system, you will receive a password reset link shortly.",
      });
    }

    // Generate reset token and send email
    const resetToken = await generatePasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.status(200).json({
      message:
        "If your email exists in our system, you will receive a password reset link shortly.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 *
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    // Find user with this reset token
    const user = await prisma.user.findFirst({
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
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res
      .status(200)
      .json({
        message:
          "Password reset successful. You can now log in with your new password.",
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate access token
 * @param userId User ID to encode in token
 * @returns JWT access token
 */
const generateAccessToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  return jwt.sign({ userId }, JWT_SECRET, options);
};

/**
 * Generate refresh token
 * @param userId User ID to encode in token
 * @returns JWT refresh token
 */
const generateRefreshToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN as any };
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, options);
};
