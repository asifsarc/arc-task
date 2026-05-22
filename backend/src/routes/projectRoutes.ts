import express from 'express';
import { createProject, getProjects, getProjectById, assignProjectClients } from '../controllers/projectController';
import taskRoutes from './taskRoutes';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Mount tasks directly to dynamically match API logic (REST) under an identifier parameter
router.use('/:projectId/tasks', taskRoutes);

router.route('/')
    .post(protect, createProject)
    .get(protect, getProjects);

router.route('/:id')
    .get(protect, getProjectById);

router.put('/:id/assign', protect, assignProjectClients);

export default router;
