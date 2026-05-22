import express from 'express';
import { inviteUser, acceptInvitation } from '../controllers/inviteController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, inviteUser);
router.post('/:token/accept', protect, acceptInvitation);

export default router;
