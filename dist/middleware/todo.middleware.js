"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTodoId = exports.validateUpdateTodo = exports.validateCreateTodo = void 0;
/**
 * Validate todo creation request
 */
const validateCreateTodo = (req, res, next) => {
    const { title, description, dueDate, priority } = req.body;
    const errors = [];
    // Title validation
    if (!title) {
        errors.push("Title is required");
    }
    else if (typeof title !== "string") {
        errors.push("Title must be a string");
    }
    else if (title.trim().length < 1) {
        errors.push("Title cannot be empty");
    }
    // Description validation (optional)
    if (description !== undefined && typeof description !== "string") {
        errors.push("Description must be a string");
    }
    // Due date validation (optional)
    if (dueDate !== undefined) {
        const dateObj = new Date(dueDate);
        if (isNaN(dateObj.getTime())) {
            errors.push("Due date must be a valid date");
        }
    }
    // Priority validation (optional)
    if (priority !== undefined) {
        const validPriorities = ["LOW", "MEDIUM", "HIGH"];
        if (!validPriorities.includes(priority)) {
            errors.push("Priority must be one of: LOW, MEDIUM, HIGH");
        }
    }
    // Return errors if any
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    next();
};
exports.validateCreateTodo = validateCreateTodo;
/**
 * Validate todo update request
 */
const validateUpdateTodo = (req, res, next) => {
    const { title, description, completed, dueDate, priority } = req.body;
    const errors = [];
    // If no fields to update
    if (title === undefined &&
        description === undefined &&
        completed === undefined &&
        dueDate === undefined &&
        priority === undefined) {
        errors.push("At least one field must be provided for update");
    }
    // Title validation (if provided)
    if (title !== undefined) {
        if (typeof title !== "string") {
            errors.push("Title must be a string");
        }
        else if (title.trim().length < 1) {
            errors.push("Title cannot be empty");
        }
    }
    // Description validation (if provided)
    if (description !== undefined && typeof description !== "string") {
        errors.push("Description must be a string");
    }
    // Completed validation (if provided)
    if (completed !== undefined && typeof completed !== "boolean") {
        errors.push("Completed status must be a boolean");
    }
    // Due date validation (if provided)
    if (dueDate !== undefined && dueDate !== null) {
        const dateObj = new Date(dueDate);
        if (isNaN(dateObj.getTime())) {
            errors.push("Due date must be a valid date");
        }
    }
    // Priority validation (if provided)
    if (priority !== undefined) {
        const validPriorities = ["LOW", "MEDIUM", "HIGH"];
        if (!validPriorities.includes(priority)) {
            errors.push("Priority must be one of: LOW, MEDIUM, HIGH");
        }
    }
    // Return errors if any
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    next();
};
exports.validateUpdateTodo = validateUpdateTodo;
/**
 * Validate todo ID parameter
 */
const validateTodoId = (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: "Todo ID is required" });
    }
    next();
};
exports.validateTodoId = validateTodoId;
