import express from 'express';
import { login, registerUser } from '../controllers/authController';

const router = express.Router();

// Маршруты
router.post('/register', registerUser);
router.post('/login', login);

export default router;
