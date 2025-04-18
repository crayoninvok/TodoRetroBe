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
exports.TodoController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const error_middleware_1 = require("../middleware/error.middleware");
class TodoController {
    /**
     * Get all todos for the current user
     */
    getAllTodos(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const todos = yield prisma_1.default.todo.findMany({
                    where: { userId },
                    orderBy: { updatedAt: "desc" },
                });
                res.status(200).json({ todos });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get a single todo by ID
     */
    getTodoById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const { id } = req.params;
                const todo = yield prisma_1.default.todo.findUnique({
                    where: { id },
                });
                if (!todo) {
                    throw new error_middleware_1.AppError("Todo not found", 404);
                }
                // Check if todo belongs to the user
                if (todo.userId !== userId) {
                    throw new error_middleware_1.AppError("Unauthorized access to this todo", 403);
                }
                res.status(200).json({ todo });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Create a new todo
     */
    createTodo(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const { title, description, dueDate, priority } = req.body;
                const todo = yield prisma_1.default.todo.create({
                    data: {
                        title,
                        description,
                        dueDate: dueDate ? new Date(dueDate) : undefined,
                        priority: priority || "MEDIUM",
                        userId,
                    },
                });
                res.status(201).json({
                    message: "Todo created successfully",
                    todo,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update a todo
     */
    updateTodo(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const { id } = req.params;
                const { title, description, completed, dueDate, priority } = req.body;
                // Check if todo exists and belongs to user
                const existingTodo = yield prisma_1.default.todo.findUnique({
                    where: { id },
                });
                if (!existingTodo) {
                    throw new error_middleware_1.AppError("Todo not found", 404);
                }
                if (existingTodo.userId !== userId) {
                    throw new error_middleware_1.AppError("Unauthorized access to this todo", 403);
                }
                // Update todo
                const updatedTodo = yield prisma_1.default.todo.update({
                    where: { id },
                    data: {
                        title: title !== undefined ? title : undefined,
                        description: description !== undefined ? description : undefined,
                        completed: completed !== undefined ? completed : undefined,
                        dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
                        priority: priority !== undefined ? priority : undefined,
                    },
                });
                res.status(200).json({
                    message: "Todo updated successfully",
                    todo: updatedTodo,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Toggle todo completion status
     */
    toggleTodoStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const { id } = req.params;
                // Check if todo exists and belongs to user
                const existingTodo = yield prisma_1.default.todo.findUnique({
                    where: { id },
                });
                if (!existingTodo) {
                    throw new error_middleware_1.AppError("Todo not found", 404);
                }
                if (existingTodo.userId !== userId) {
                    throw new error_middleware_1.AppError("Unauthorized access to this todo", 403);
                }
                // Toggle completion status
                const updatedTodo = yield prisma_1.default.todo.update({
                    where: { id },
                    data: {
                        completed: !existingTodo.completed,
                    },
                });
                res.status(200).json({
                    message: `Todo marked as ${updatedTodo.completed ? "completed" : "incomplete"}`,
                    todo: updatedTodo,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Delete a todo
     */
    deleteTodo(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const { id } = req.params;
                // Check if todo exists and belongs to user
                const existingTodo = yield prisma_1.default.todo.findUnique({
                    where: { id },
                });
                if (!existingTodo) {
                    throw new error_middleware_1.AppError("Todo not found", 404);
                }
                if (existingTodo.userId !== userId) {
                    throw new error_middleware_1.AppError("Unauthorized access to this todo", 403);
                }
                // Delete todo
                yield prisma_1.default.todo.delete({
                    where: { id },
                });
                res.status(200).json({
                    message: "Todo deleted successfully",
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.TodoController = TodoController;
exports.default = new TodoController();
