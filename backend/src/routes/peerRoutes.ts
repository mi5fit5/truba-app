import express from 'express';

import { getIceServers } from '../controllers/peerController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// Защищённый маршрут
router.get('/ice-servers', authMiddleware, getIceServers);

export default router;
