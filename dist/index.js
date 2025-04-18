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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_router_1 = __importDefault(require("./router/auth.router"));
const todo_router_1 = __importDefault(require("./router/todo.router"));
const error_middleware_1 = require("./middleware/error.middleware");
const prisma_1 = __importDefault(require("./config/prisma"));
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
// Routes
app.use("/api/auth", auth_router_1.default);
app.use("/api/todos", todo_router_1.default);
// Base route
app.get("/", (req, res) => {
    res.json({ message: "Todo API is running" });
});
// Error handling middleware (should be last)
app.use(error_middleware_1.errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Handle shutdown gracefully
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$disconnect();
    console.log("Disconnected from database");
    process.exit(0);
}));
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$disconnect();
    console.log("Disconnected from database");
    process.exit(0);
}));
