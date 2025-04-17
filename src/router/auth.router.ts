import express from "express";
import authController from "../controllers/auth.controller";
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

// Registration and verification
router.post(
  "/register",
  validateRegistration,
  authController.register.bind(authController)
);
router.get("/verify-email", authController.verifyEmail.bind(authController));
router.post(
  "/resend-verification",
  validateForgotPassword,
  authController.resendVerificationEmail.bind(authController)
);

// Login and session management
router.post("/login", validateLogin, authController.login.bind(authController));
router.post(
  "/refresh-token",
  validateRefreshToken,
  authController.refreshToken.bind(authController)
);
router.post(
  "/logout",
  validateLogout,
  authController.logout.bind(authController)
);

// Password management
router.post(
  "/forgot-password",
  validateForgotPassword,
  authController.requestPasswordReset.bind(authController)
);
router.post(
  "/reset-password",
  validatePasswordReset,
  authController.resetPassword.bind(authController)
);

// User profile
router.get(
  "/profile",
  authenticate,
  authController.getProfile.bind(authController)
);

export default router;
