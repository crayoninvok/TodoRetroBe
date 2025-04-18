import express from "express";
import todoController from "../controllers/todo.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  validateCreateTodo,
  validateUpdateTodo,
  validateTodoId,
} from "../middleware/todo.middleware";

const router = express.Router();

// Apply authentication middleware to all todo routes
router.use(authenticate);

// Get all todos for current user
router.get("/", todoController.getAllTodos.bind(todoController));

// Get a single todo by ID
router.get(
  "/:id",
  validateTodoId,
  todoController.getTodoById.bind(todoController)
);

// Create a new todo
router.post(
  "/",
  validateCreateTodo,
  todoController.createTodo.bind(todoController)
);

// Update a todo
router.put(
  "/:id",
  validateTodoId,
  validateUpdateTodo,
  todoController.updateTodo.bind(todoController)
);

// Toggle todo completion status
router.patch(
  "/:id/toggle",
  validateTodoId,
  todoController.toggleTodoStatus.bind(todoController)
);

// Delete a todo
router.delete(
  "/:id",
  validateTodoId,
  todoController.deleteTodo.bind(todoController)
);

export default router;
