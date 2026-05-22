import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { getIO } from '../utils/socket';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';

// Middleware logic check helper
const checkProjectMembership = async (projectId: string, userId: string) => {
    const user = await User.findById(userId);
    if (user && user.role === 'admin') return true;

    const project = await Project.findById(projectId);
    if (!project) return false;
    
    const isMember = project.members.some(m => m.userId.toString() === userId) || project.ownerId.toString() === userId;
    return isMember;
};

// @desc    Create a new task
// @route   POST /api/projects/:projectId/tasks
// @access  Private
export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId as string;
    const { title, description, status } = req.body;

    const isMember = await checkProjectMembership(projectId, req.user?._id.toString() || '');
    if (!isMember) {
        res.status(403);
        throw new Error('Not authorized to manage tasks in this project');
    }

    // Determine the highest order for the new task to place it at the bottom of the column
    const lastTask = await Task.findOne({ projectId, status: status || 'Todo' }).sort('-order');
    const newOrder = lastTask ? lastTask.order + 1000 : 1000;

    const task = await Task.create({
        projectId,
        title,
        description,
        status: status || 'Todo',
        order: newOrder
    });

    getIO().to(projectId).emit('task_created', task);

    res.status(201).json(task);
});

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
export const getTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId as string;

    const isMember = await checkProjectMembership(projectId, req.user?._id.toString() || '');
    if (!isMember) {
        res.status(403);
        throw new Error('Not authorized to view tasks in this project');
    }

    const tasks = await Task.find({ projectId }).sort('order');
    res.json(tasks);
});

// @desc    Update a task (title, description, status)
// @route   PUT /api/projects/:projectId/tasks/:id
// @access  Private
export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId as string;
    const id = req.params.id as string;
    const { title, description, status, assignedTo } = req.body;

    const isMember = await checkProjectMembership(projectId, req.user?._id.toString() || '');
    if (!isMember) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const task = await Task.findOne({ _id: id, projectId });

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status || task.status;
    if (assignedTo) task.assignedTo = assignedTo;

    const updatedTask = await task.save();
    getIO().to(projectId).emit('task_updated', updatedTask);
    res.json(updatedTask);
});

// @desc    Move a task (drag and drop order update)
// @route   PATCH /api/projects/:projectId/tasks/:id/move
// @access  Private
export const moveTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId as string;
    const id = req.params.id as string;
    const { status, order } = req.body; // Calculated dynamically on the frontend to avoid DB iterables

    const isMember = await checkProjectMembership(projectId, req.user?._id.toString() || '');
    if (!isMember) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const task = await Task.findOne({ _id: id, projectId });

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (status) task.status = status;
    if (order !== undefined) task.order = order;

    const updatedTask = await task.save();
    getIO().to(projectId).emit('task_updated', updatedTask);
    res.json(updatedTask);
});

// @desc    Delete a task
// @route   DELETE /api/projects/:projectId/tasks/:id
// @access  Private
export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = req.params.projectId as string;
    const id = req.params.id as string;

    const isMember = await checkProjectMembership(projectId, req.user?._id.toString() || '');
    if (!isMember) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const task = await Task.findOne({ _id: id, projectId });

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    await task.deleteOne();
    getIO().to(projectId).emit('task_deleted', id);
    res.json({ message: 'Task removed' });
});
