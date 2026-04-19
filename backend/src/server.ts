import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { connectDB } from './lib/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
	cors({
		origin: 'http://localhost:8080',
		credentials: true,
	})
);

app.use(express.json());
app.use(cookieParser());

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

connectDB().then(() => {
	app.listen(+PORT, () => {
		console.log(`Сервер запущен на порту ${PORT}`);
	});
});
