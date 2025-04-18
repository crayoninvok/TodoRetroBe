"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const todo_controller_1 = __importDefault(require("../controllers/todo.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const todo_middleware_1 = require("../middleware/todo.middleware");
const router = express_1.default.Router();
// Apply authentication middleware to all todo routes
router.use(auth_middleware_1.authenticate);
// Get all todos for current user
router.get("/", todo_controller_1.default.getAllTodos.bind(todo_controller_1.default));
// Get a single todo by ID
router.get("/:id", todo_middleware_1.validateTodoId, todo_controller_1.default.getTodoById.bind(todo_controller_1.default));
// Create a new todo
router.post("/", todo_middleware_1.validateCreateTodo, todo_controller_1.default.createTodo.bind(todo_controller_1.default));
// Update a todo
router.put("/:id", todo_middleware_1.validateTodoId, todo_middleware_1.validateUpdateTodo, todo_controller_1.default.updateTodo.bind(todo_controller_1.default));
// Toggle todo completion status
router.patch("/:id/toggle", todo_middleware_1.validateTodoId, todo_controller_1.default.toggleTodoStatus.bind(todo_controller_1.default));
// Delete a todo
router.delete("/:id", todo_middleware_1.validateTodoId, todo_controller_1.default.deleteTodo.bind(todo_controller_1.default));
exports.default = router;
