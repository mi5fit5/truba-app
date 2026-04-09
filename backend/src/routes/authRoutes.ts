import express from 'express';

import { getCurrentUser, login, logout, registerUser } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// Маршруты
router.post('/register', registerUser);
router.post('/login', login);

// Защищённые маршруты
router.post('/logout', authMiddleware, logout);
router.get('/user/me', authMiddleware, getCurrentUser);

export default router;
