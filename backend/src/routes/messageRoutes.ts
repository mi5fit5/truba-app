import express from 'express';

import { authMiddleware } from '../middlewares/auth';
import { getChatHistory, sendMessage } from '../controllers/messageController';

const router = express.Router();

router.use(authMiddleware);

// Маршруты
router.get('/:id', getChatHistory);
router.post('/send/:id', sendMessage);

export default router;
