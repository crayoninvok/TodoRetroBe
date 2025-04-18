"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogout = exports.validateRefreshToken = exports.validateForgotPassword = exports.validatePasswordReset = exports.validateLogin = exports.validateRegistration = void 0;
/**
 * Validate registration request
 * Checks email, password, and name
 */
const validateRegistration = (req, res, next) => {
    const { email, password, name } = req.body;
    const errors = [];
    // Email validation
    if (!email) {
        errors.push("Email is required");
    }
    else if (!isValidEmail(email)) {
        errors.push("Invalid email format");
    }
    // Password validation
    if (!password) {
        errors.push("Password is required");
    }
    else if (password.length < 6) {
        errors.push("Password must be at least 6 characters long");
    }
    // Name is optional, but if provided, validate it
    if (name !== undefined && typeof name !== "string") {
        errors.push("Name must be a string");
    }
    // Return errors if any
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    next();
};
exports.validateRegistration = validateRegistration;
/**
 * Validate login request
 * Checks email and password
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];
    // Email validation
    if (!email) {
        errors.push("Email is required");
    }
    // Password validation
    if (!password) {
        errors.push("Password is required");
    }
    // Return errors if any
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    next();
};
exports.validateLogin = validateLogin;
/**
 * Validate password reset request
 * Checks token and new password
 */
const validatePasswordReset = (req, res, next) => {
    const { token, newPassword } = req.body;
    const errors = [];
    // Required fields
    if (!token) {
        errors.push("Token is required");
    }
    // Password validation
    if (!newPassword) {
        errors.push("New password is required");
    }
    else if (newPassword.length < 6) {
        errors.push("New password must be at least 6 characters long");
    }
    // Return errors if any
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    next();
};
exports.validatePasswordReset = validatePasswordReset;
/**
 * Validate forgot password request
 * Checks email
 */
const validateForgotPassword = (req, res, next) => {
    const { email } = req.body;
    const errors = [];
    // Email validation
    if (!email) {
        errors.push("Email is required");
    }
    else if (!isValidEmail(email)) {
        errors.push("Invalid email format");
    }
    // Return errors if any
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    next();
};
exports.validateForgotPassword = validateForgotPassword;
/**
 * Validate refresh token request
 * Checks refresh token
 */
const validateRefreshToken = (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
    }
    next();
};
exports.validateRefreshToken = validateRefreshToken;
/**
 * Validate logout request
 * Checks refresh token
 */
const validateLogout = (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
    }
    next();
};
exports.validateLogout = validateLogout;
/**
 * Helper function to validate email format
 * @param email Email to validate
 * @returns Boolean indicating if email format is valid
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
