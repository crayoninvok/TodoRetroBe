import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  resendVerificationEmail,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateForgotPassword,
  validateRefreshToken,
  validateLogout,
} from "../middleware/validation.middleware";

const router = express.Router();

/**
 * Authentication Routes
 */

// Registration and verification
router.post("/register", validateRegistration, register);
router.get("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  validateForgotPassword,
  resendVerificationEmail
);

// Login and session management
router.post("/login", validateLogin, login);
router.post("/refresh-token", validateRefreshToken, refreshToken);
router.post("/logout", validateLogout, logout);

// Password management
router.post("/forgot-password", validateForgotPassword, requestPasswordReset);
router.post("/reset-password", validatePasswordReset, resetPassword);

// User profile
router.get("/profile", authenticate, getProfile);

export default router;
