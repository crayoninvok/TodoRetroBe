import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AppError } from "../middleware/error.middleware";

export class TodoController {
  /**
   * Get all todos for the current user
   */
  async getAllTodos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      const todos = await prisma.todo.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      res.status(200).json({ todos });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single todo by ID
   */
  async getTodoById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      const todo = await prisma.todo.findUnique({
        where: { id },
      });

      if (!todo) {
        throw new AppError("Todo not found", 404);
      }

      // Check if todo belongs to the user
      if (todo.userId !== userId) {
        throw new AppError("Unauthorized access to this todo", 403);
      }

      res.status(200).json({ todo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new todo
   */
  async createTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const { title, description, dueDate, priority } = req.body;

      const todo = await prisma.todo.create({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a todo
   */
  async updateTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      const { title, description, completed, dueDate, priority } = req.body;

      // Check if todo exists and belongs to user
      const existingTodo = await prisma.todo.findUnique({
        where: { id },
      });

      if (!existingTodo) {
        throw new AppError("Todo not found", 404);
      }

      if (existingTodo.userId !== userId) {
        throw new AppError("Unauthorized access to this todo", 403);
      }

      // Update todo
      const updatedTodo = await prisma.todo.update({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle todo completion status
   */
  async toggleTodoStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      // Check if todo exists and belongs to user
      const existingTodo = await prisma.todo.findUnique({
        where: { id },
      });

      if (!existingTodo) {
        throw new AppError("Todo not found", 404);
      }

      if (existingTodo.userId !== userId) {
        throw new AppError("Unauthorized access to this todo", 403);
      }

      // Toggle completion status
      const updatedTodo = await prisma.todo.update({
        where: { id },
        data: {
          completed: !existingTodo.completed,
        },
      });

      res.status(200).json({
        message: `Todo marked as ${
          updatedTodo.completed ? "completed" : "incomplete"
        }`,
        todo: updatedTodo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a todo
   */
  async deleteTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      // Check if todo exists and belongs to user
      const existingTodo = await prisma.todo.findUnique({
        where: { id },
      });

      if (!existingTodo) {
        throw new AppError("Todo not found", 404);
      }

      if (existingTodo.userId !== userId) {
        throw new AppError("Unauthorized access to this todo", 403);
      }

      // Delete todo
      await prisma.todo.delete({
        where: { id },
      });

      res.status(200).json({
        message: "Todo deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TodoController();
