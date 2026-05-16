import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';

import { connectDB } from './lib/db';
import { app, server } from './lib/socket';
import './lib/passport';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import steamRoutes from './routes/steamRoutes';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	})
);

app.use(express.json());
app.use(cookieParser());

// Временная сессия
app.use(
	session({
		secret: process.env.SESSION_SECRET as string,
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 1000 * 60 * 20,
			sameSite: 'lax',
		},
	})
);

app.use(passport.initialize());
app.use(passport.session());

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth/steam', steamRoutes);

connectDB().then(() => {
	server.listen(+PORT, () => {
		console.log(`Сервер запущен на порту ${PORT}`);
	});
});
