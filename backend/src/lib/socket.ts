import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import User from '../models/User';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: 'http://localhost:8080',
	},
});

// Объект для хранения подключенных пользователей (userId: sockedId)
const userSocketMap: { [key: string]: string } = {};

// Поиск конкретного пользователя по его id из БД
export function getReceiverSocketId(userId: string) {
	return userSocketMap[userId];
}

io.on('connection', (socket) => {
	const userId = socket.handshake.query.userId as string;

	if (userId && userId !== 'undefined') {
		userSocketMap[userId] = socket.id;
	}

	// Для отправки событий всем подключенным пользователям
	io.emit('getOnlineUsers', Object.keys(userSocketMap));

	// Инициация звонка
	socket.on('callToParticipant', async (data) => {
		const { userToCall, signalData, callType } = data;
		const targetSocketId = getReceiverSocketId(userToCall);

		if (targetSocketId) {
			try {
				const caller = await User.findById(userId).select(
					'_id username avatar'
				);

				if (caller) {
					io.to(targetSocketId).emit('incomingCall', {
						from: {
							_id: caller._id.toString(),
							username: caller.username,
							avatar: caller.avatar,
						},
						signal: signalData,
						callType: callType,
					});
				}
			} catch (err: unknown) {
				console.error('Ошибка при получении пользователя для звонка:', err);
			}
		}
	});

	// Собеседник принял звонок
	socket.on('answerCall', (data) => {
		const { to, signal } = data;
		const targetSocketId = getReceiverSocketId(to);

		if (targetSocketId) {
			io.to(targetSocketId).emit('acceptedCall', signal);
		}
	});

	// Завершение звонка
	socket.on('endCall', (data) => {
		const { to } = data;
		const targetSocketId = getReceiverSocketId(to);

		if (targetSocketId) {
			io.to(targetSocketId).emit('completedCall');
		}
	});

	// Отключение
	socket.on('disconnect', () => {
		// Удаляем пользователя из объекта при его отключении
		if (userId) {
			delete userSocketMap[userId];
		}

		// Отправляем обновленный список
		io.emit('getOnlineUsers', Object.keys(userSocketMap));
	});
});

export { app, io, server };
