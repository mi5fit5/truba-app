import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';

import { connectDB } from './lib/db';
import { app, server, io } from './lib/socket';
import './lib/passport';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import steamRoutes from './routes/steamRoutes';
import peerRoutes from './routes/peerRoutes';

dotenv.config();

const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.CLIENT_URL
	? process.env.CLIENT_URL.split(',')
	: ['http://localhost:8080'];

app.use(
	cors({
		origin: function (origin, callback) {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error('Не разрешено CORS'));
			}
		},
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

app.set('io', io);

// Маршруты
app.use('/api/auth/steam', steamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/peer', peerRoutes);

if (process.env.NODE_ENV !== 'test') {
	connectDB().then(() => {
		server.listen(+PORT, () => {
			console.log(`Сервер запущен на порту ${PORT}`);
		});
	});
}

export { app };
