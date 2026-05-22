import express from 'express';
import { authUser, registerUser, getUserProfile, getClients } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.get('/clients', protect, getClients);

export default router;
