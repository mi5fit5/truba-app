import express from 'express';
import {
	acceptFriendRequest,
	getCurrentUserFriends,
	getIncomingFriendRequests,
	rejectFriendRequest,
	sendFriendRequest,
	getCurrentUser,
	updateUserProfile,
	removeFriend,
} from '../controllers/userController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

router.use(authMiddleware);

// Маршруты
router.get('/me', getCurrentUser);
router.patch('/me', updateUserProfile);

router.get('/friends', getCurrentUserFriends);
router.delete('/friends/:id', removeFriend);

router.get('/friend-requests', getIncomingFriendRequests);
router.post('/friend-request/:id', sendFriendRequest);
router.put('/friend-request/:id/accept', acceptFriendRequest);
router.delete('/friend-request/:id', rejectFriendRequest);

export default router;
