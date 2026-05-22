import express from 'express';
import { createTask, getTasks, updateTask, deleteTask, moveTask } from '../controllers/taskController';
import { protect } from '../middlewares/authMiddleware';

// We mergeParams because :projectId is mounted iteratively on the project route instead.
const router = express.Router({ mergeParams: true });

router.route('/')
    .post(protect, createTask)
    .get(protect, getTasks);

router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, deleteTask);

router.route('/:id/move')
    .patch(protect, moveTask);

export default router;
