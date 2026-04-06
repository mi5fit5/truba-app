import express from 'express';
import { login, logout, registerUser } from '../controllers/authController';

const router = express.Router();

// Маршруты
router.post('/register', registerUser);
router.post('/login', login);
router.post('/logout', logout);

export default router;
