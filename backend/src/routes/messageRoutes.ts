import express from 'express';

import { authMiddleware } from '../middlewares/auth';
import {
	getChatHistory,
	searchMessages,
	sendMessage,
} from '../controllers/messageController';

const router = express.Router();

router.use(authMiddleware);

// Маршруты
router.get('/:id', getChatHistory);
router.get('/:id/search', searchMessages);
router.post('/send/:id', sendMessage);

export default router;
