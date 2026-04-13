import express from 'express';

import { login, logout, registerUser } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

// Маршруты
router.post('/register', registerUser);
router.post('/login', login);

// Защищённые маршруты
router.post('/logout', authMiddleware, logout);

export default router;
