import http from 'http';
import express from 'express';
import { Server } from 'socket.io';

import User from '../models/User';
import Message from '../models/Message';
import { formatCallDuration } from '../utils/dateUtils';

// Структура активных звонков
interface ActiveCall {
	startTime: number;
	initiatorId: string;
	recipientId: string;
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: 'http://localhost:8080',
	},
});

// Объект для хранения подключенных пользователей (userId: sockedId)
const userSocketMap: { [key: string]: string } = {};

// Объект для хранения активных звонков
const activeCallsMap = new Map<string, ActiveCall>();

// Создание уникального ключа для активного звонка из id пользователей
function getCallKey(firstUserId: string, secondUserId: string) {
	return [firstUserId.toString(), secondUserId.toString()].sort().join('-');
}

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

		// Регистрируем попытку звонка
		const activeCallKey = getCallKey(userId, userToCall);
		activeCallsMap.set(activeCallKey, {
			startTime: 0,
			initiatorId: userId,
			recipientId: userToCall,
		});

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

		// Фиксация времени начала звонка
		const activeCallKey = getCallKey(userId, to);
		const activeCall = activeCallsMap.get(activeCallKey);

		if (activeCall) {
			activeCall.startTime = Date.now();
		}

		if (targetSocketId) {
			io.to(targetSocketId).emit('acceptedCall', signal);
		}
	});

	// Переключение медиа-устройств во время звонка
	socket.on('toggleMedia', (data) => {
		const { to, type, isMuted } = data;
		const targetSocketId = getReceiverSocketId(to);

		socket.to(targetSocketId).emit('peerMediaToggled', { type, isMuted });
	});

	// Завершение звонка
	socket.on('endCall', async (data) => {
		const { to } = data;
		const targetSocketId = getReceiverSocketId(to);

		const activeCallKey = getCallKey(userId, to);
		const activeCall = activeCallsMap.get(activeCallKey);

		if (activeCall && activeCall.startTime > 0) {
			const durationSeconds = Math.floor(
				(Date.now() - activeCall.startTime) / 1000
			);
			activeCallsMap.delete(activeCallKey); // Удаляем из объекта

			try {
				const initiator = await User.findById(activeCall.initiatorId);

				if (initiator) {
					const durationText = formatCallDuration(durationSeconds);
					const messageText = `${initiator.username} начал новый звонок, который продлился ${durationText}!`;

					// Создаем новое сообщение
					const systemMessage = await Message.create({
						sender: activeCall.initiatorId,
						recipient: activeCall.recipientId,
						text: messageText,
						type: 'system',
					});

					// Отправляем новое сообщение обоим участникам в чат
					const initiatorSocketId = getReceiverSocketId(activeCall.initiatorId);
					const recipientSocketId = getReceiverSocketId(activeCall.recipientId);

					if (initiatorSocketId)
						io.to(initiatorSocketId).emit('newMessage', systemMessage);
					if (recipientSocketId)
						io.to(recipientSocketId).emit('newMessage', systemMessage);
				}
			} catch (err: unknown) {
				console.error('Ошибка отправки системного сообщения:', err);
			}
		} else {
			activeCallsMap.delete(activeCallKey); // Очищаем объект, если звонок сбросили до ответа
		}

		// Отправляем сигнал о завершении собеседнику
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
