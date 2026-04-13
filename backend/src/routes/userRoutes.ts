import express from 'express';
import {
	acceptFriendRequest,
	getCurrentUserFriends,
	getIncomingFriendRequests,
	rejectFriendRequest,
	sendFriendRequest,
  getCurrentUser,
} from '../controllers/userController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

router.use(authMiddleware);

// Маршруты
router.get('/me', getCurrentUser);
router.get('/friends', getCurrentUserFriends);

router.get('/friend-requests', getIncomingFriendRequests);
router.post('/friend-request/:id', sendFriendRequest);
router.put('/friend-request/:id/accept', acceptFriendRequest);
router.delete('/friend-request/:id', rejectFriendRequest);

export default router;
