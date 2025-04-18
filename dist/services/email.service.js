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
exports.generatePasswordResetToken = exports.sendPasswordResetEmail = exports.sendVerificationEmail = exports.generateVerificationToken = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../config/prisma"));
const handlebars_1 = __importDefault(require("handlebars"));
// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_USER = process.env.EMAIL_USER || "your-email@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "your-email-password-or-app-password";
const EMAIL_FROM = process.env.EMAIL_FROM || "Todo App <your-email@gmail.com>";
const APP_URL = process.env.APP_URL || "http://localhost:8000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// Create transporter
const transporter = nodemailer_1.default.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});
// Function to render template with Handlebars
const renderTemplate = (template, context) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Read the template file
        const templatePath = path_1.default.resolve(`./src/templates/${template}.hbs`);
        const templateContent = yield promises_1.default.readFile(templatePath, "utf-8");
        // Compile and render the template
        const compiledTemplate = handlebars_1.default.compile(templateContent);
        return compiledTemplate(context);
    }
    catch (error) {
        console.error("Failed to render email template:", error);
        // Fallback to simple HTML
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2>${context.subject || "Notification"}</h2>
        <p>Hello ${context.name || "there"},</p>
        <p>${context.message || "Please check your notification."}</p>
        <p>${context.actionText
            ? `<a href="${context.actionLink}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">${context.actionText}</a>`
            : ""}</p>
        ${context.actionLink
            ? `<p>Or copy and paste this URL into your browser:</p><p>${context.actionLink}</p>`
            : ""}
        <p>Thank you,<br>Todo App Team</p>
        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #777;">
          <p>&copy; ${new Date().getFullYear()} Todo App. All rights reserved.</p>
        </div>
      </div>
    `;
    }
});
// Generate verification token
const generateVerificationToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Generate a random token
    const token = crypto_1.default.randomBytes(32).toString("hex");
    console.log("Generated raw token:", token);
    // Calculate expiry (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    // Save token to user record
    yield prisma_1.default.user.update({
        where: { id: userId },
        data: {
            verificationToken: token,
            verificationExpires: expiresAt,
        },
    });
    return token;
});
exports.generateVerificationToken = generateVerificationToken;
// Send verification email using HBS template
const sendVerificationEmail = (email, name, token) => __awaiter(void 0, void 0, void 0, function* () {
    // Important: Make sure FRONTEND_URL doesn't have a trailing slash
    const frontendUrl = FRONTEND_URL.replace(/\/$/, "");
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
    console.log("Sending verification email to:", email);
    console.log("Verification link:", verificationLink);
    const context = {
        name: name || "there",
        subject: "Verify Your Email Address",
        message: "Thank you for registering. Please click the link below to verify your email address:",
        actionText: "Verify Email",
        actionLink: verificationLink,
        year: new Date().getFullYear(),
    };
    try {
        // Render the email template
        const html = yield renderTemplate("verification", context);
        // Send email
        yield transporter.sendMail({
            from: EMAIL_FROM,
            to: email,
            subject: "Verify Your Email Address",
            html,
        });
        console.log(`Verification email sent to ${email}`);
    }
    catch (error) {
        console.error("Failed to send verification email:", error);
        console.error(error);
        // Don't throw, just log - we want registration to succeed even if email fails
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
// Send password reset email using HBS template
const sendPasswordResetEmail = (email, name, token) => __awaiter(void 0, void 0, void 0, function* () {
    const frontendUrl = FRONTEND_URL.replace(/\/$/, "");
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    console.log("Sending password reset email to:", email);
    console.log("Reset link:", resetLink);
    const context = {
        name: name || "there",
        subject: "Reset Your Password",
        message: "You requested to reset your password. Please click the link below to set a new password:",
        actionText: "Reset Password",
        actionLink: resetLink,
        year: new Date().getFullYear(),
    };
    try {
        // Render the email template
        const html = yield renderTemplate("reset-password", context);
        // Send email
        yield transporter.sendMail({
            from: EMAIL_FROM,
            to: email,
            subject: "Reset Your Password",
            html,
        });
        console.log(`Password reset email sent to ${email}`);
    }
    catch (error) {
        console.error("Failed to send password reset email:", error);
        // Don't throw, just log
    }
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
// Generate password reset token
const generatePasswordResetToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Generate a random token
    const token = crypto_1.default.randomBytes(32).toString("hex");
    // Calculate expiry (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    // Save token to user record
    yield prisma_1.default.user.update({
        where: { id: userId },
        data: {
            passwordResetToken: token,
            passwordResetExpires: expiresAt,
        },
    });
    return token;
});
exports.generatePasswordResetToken = generatePasswordResetToken;
