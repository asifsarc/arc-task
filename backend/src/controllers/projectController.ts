import { Request, Response } from 'express';
import { Project } from '../models/Project';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, assignedClientId } = req.body;

    const members: { userId: any; role: 'owner' | 'client' }[] = [{ userId: req.user?._id, role: 'owner' }];
    if (assignedClientId && req.user?.role === 'admin') {
        members.push({ userId: assignedClientId, role: 'client' });
    }

    const project = await Project.create({
        name,
        description,
        ownerId: req.user?._id,
        members
    });

    res.status(201).json(project);
});

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
export const getProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
    let query = {};
    if (req.user?.role !== 'admin') {
        query = {
            $or: [
                { ownerId: req.user?._id },
                { 'members.userId': req.user?._id }
            ]
        };
    }

    const projects = await Project.find(query)
        .populate('ownerId', 'name email')
        .populate('members.userId', 'name email avatar');

    res.json(projects);
});

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await Project.findById(req.params.id)
        .populate('ownerId', 'name email')
        .populate('members.userId', 'name email avatar');

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Role-based access check - verify user is either an owner or assigned member or admin
    const isMember = project.members.some(m => (m.userId as any)?._id?.toString() === req.user?._id.toString());
    const isOwner = (project.ownerId as any)?._id?.toString() === req.user?._id.toString();
    const isAdmin = req.user?.role === 'admin';
    
    if (!isMember && !isOwner && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to access this project');
    }

    res.json(project);
});

// @desc    Assign clients to a project/workspace
// @route   PUT /api/projects/:id/assign
// @access  Private/Admin
export const assignProjectClients = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized as an admin');
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const { clientIds } = req.body;
    if (!Array.isArray(clientIds)) {
        res.status(400);
        throw new Error('clientIds must be an array');
    }

    // Keep the owner in the members array, but update the client members.
    const ownerMember = project.members.find(m => m.role === 'owner');
    const newMembers = ownerMember ? [ownerMember] : [];

    clientIds.forEach(id => {
        if (ownerMember && ownerMember.userId.toString() === id.toString()) return;
        newMembers.push({
            userId: id as any,
            role: 'client' as const
        });
    });

    project.members = newMembers;
    const updatedProject = await project.save();

    const populated = await Project.findById(updatedProject._id)
        .populate('ownerId', 'name email')
        .populate('members.userId', 'name email avatar');

    res.json(populated);
});
