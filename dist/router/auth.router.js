"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = express_1.default.Router();
// Registration and verification
router.post("/register", validation_middleware_1.validateRegistration, auth_controller_1.default.register.bind(auth_controller_1.default));
router.get("/verify-email", auth_controller_1.default.verifyEmail.bind(auth_controller_1.default));
router.post("/resend-verification", validation_middleware_1.validateForgotPassword, auth_controller_1.default.resendVerificationEmail.bind(auth_controller_1.default));
// Login and session management
router.post("/login", validation_middleware_1.validateLogin, auth_controller_1.default.login.bind(auth_controller_1.default));
router.post("/refresh-token", validation_middleware_1.validateRefreshToken, auth_controller_1.default.refreshToken.bind(auth_controller_1.default));
router.post("/logout", validation_middleware_1.validateLogout, auth_controller_1.default.logout.bind(auth_controller_1.default));
// Password management
router.post("/forgot-password", validation_middleware_1.validateForgotPassword, auth_controller_1.default.requestPasswordReset.bind(auth_controller_1.default));
router.post("/reset-password", validation_middleware_1.validatePasswordReset, auth_controller_1.default.resetPassword.bind(auth_controller_1.default));
// User profile
router.get("/profile", auth_middleware_1.authenticate, auth_controller_1.default.getProfile.bind(auth_controller_1.default));
exports.default = router;
