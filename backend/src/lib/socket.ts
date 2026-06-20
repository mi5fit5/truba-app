import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

import User from '../models/User';
import Message from '../models/Message';
import { formatCallDuration } from '../utils/dateUtils';
import { getCallKey } from '../utils/socketUtils';
import { startSteamPolling, gameStatusCache } from './steamPolling';

// Структура активных звонков
interface IActiveCall {
	startTime: number;
	initiatorId: string;
	recipientId: string;
}

// Структура приглашения в игру Steam
interface IGameInvite {
	to: string;
	gameName: string;
	appId: string;
	lobbyId: string | null;
}

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
	? process.env.CLIENT_URL.split(',')
	: ['http://localhost:8080'];

const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		credentials: true,
	},
});

// Аутентификация WebSocket-подключений через JWT
io.use((socket, next) => {
	if (!socket.handshake.headers.cookie) {
		return next(new Error('Отсутствует cookie для аутентификации'));
	}

	const cookies = cookie.parse(socket.handshake.headers.cookie);
	const token = cookies.jwt;

	if (!token) {
		return next(new Error('JWT токен отсутствует'));
	}

	try {
		const decodedToken = jwt.verify(
			token,
			process.env.JWT_SECRET_KEY as string
		) as {
			_id: string;
		};

		socket.data.userId = decodedToken._id;
		next();
	} catch {
		return next(new Error('Невалидный JWT токен'));
	}
});

// Объект для хранения подключенных пользователей
const userSocketMap: { [key: string]: Set<string> } = {};

// Объект для хранения активных звонков
const activeCallsMap = new Map<string, IActiveCall>();

// Поиск конкретного пользователя по его id из БД
export function getReceiverSocketId(userId: string): string[] {
	return Array.from(userSocketMap[userId] || []);
}

io.on('connection', (socket) => {
	const userId = socket.data.userId as string;

	if (userId) {
		if (!userSocketMap[userId]) {
			userSocketMap[userId] = new Set();
		}
		userSocketMap[userId].add(socket.id);
	}

	// Для отправки событий всем подключенным пользователям
	io.emit('getOnlineUsers', Object.keys(userSocketMap));

	// Проставляем игровые статусы при подключении
	gameStatusCache.forEach((status, cachedUserId) => {
		if (status && status.gameName) {
			socket.emit('gameStatusChanged', {
				userId: cachedUserId,
				currentGame: status.gameName,
				appId: status.appId,
				lobbyId: status.lobbyId,
			});
		}
	});

	// Инициация звонка
	socket.on('callToParticipant', async (data) => {
		if (!data || typeof data.userToCall !== 'string') return;

		const { userToCall, signalData, callType, mediaState } = data;
		const targetSocketId = getReceiverSocketId(userToCall);

		// Регистрируем попытку звонка
		const activeCallKey = getCallKey(userId, userToCall);
		activeCallsMap.set(activeCallKey, {
			startTime: 0,
			initiatorId: userId,
			recipientId: userToCall,
		});

		if (targetSocketId.length > 0) {
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
						mediaState: mediaState,
					});
				}
			} catch (err: unknown) {
				console.error('Ошибка при получении пользователя для звонка:', err);
			}
		}
	});

	// Собеседник принял звонок
	socket.on('answerCall', (data) => {
		if (!data || typeof data.to !== 'string') return;

		const { to, signal, mediaState } = data;
		const targetSocketId = getReceiverSocketId(to);

		// Фиксация времени начала звонка
		const activeCallKey = getCallKey(userId, to);
		const activeCall = activeCallsMap.get(activeCallKey);

		if (activeCall) {
			activeCall.startTime = Date.now();
		}

		if (targetSocketId.length > 0) {
			io.to(targetSocketId).emit('acceptedCall', { signal, mediaState });
		}

		const otherSockets = getReceiverSocketId(userId).filter(
			(id) => id !== socket.id
		);
		if (otherSockets.length > 0) {
			io.to(otherSockets).emit('callAnsweredSomewhereElse');
		}
	});

	// Переключение медиа-устройств во время звонка
	socket.on('toggleMedia', (data) => {
		if (!data || typeof data.to !== 'string') return;

		const { to, type, isMuted } = data;
		const targetSocketId = getReceiverSocketId(to);

		if (targetSocketId.length > 0) {
			io.to(targetSocketId).emit('peerMediaToggled', { type, isMuted });
		}
	});

	// Завершение звонка
	socket.on('endCall', async (data) => {
		if (!data || typeof data.to !== 'string') return;

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

					const messagePayload = {
						...systemMessage.toJSON(),
						isSystem: true,
					};

					// Отправляем новое сообщение обоим участникам в чат
					const initiatorSocketId = getReceiverSocketId(activeCall.initiatorId);
					const recipientSocketId = getReceiverSocketId(activeCall.recipientId);

					if (initiatorSocketId.length > 0)
						io.to(initiatorSocketId).emit('newMessage', messagePayload);
					if (recipientSocketId.length > 0)
						io.to(recipientSocketId).emit('newMessage', messagePayload);
				}
			} catch (err: unknown) {
				console.error('Ошибка отправки системного сообщения:', err);
			}
		} else {
			activeCallsMap.delete(activeCallKey); // Очищаем объект, если звонок сбросили до ответа
		}

		// Отправляем сигнал о завершении собеседнику
		if (targetSocketId.length > 0) {
			io.to(targetSocketId).emit('completedCall');
		}

		// Уведомляем другие сессии текущего пользователя о завершении звонка
		const myOtherSockets = getReceiverSocketId(userId).filter(
			(id) => id !== socket.id
		);
		if (myOtherSockets.length > 0) {
			io.to(myOtherSockets).emit('completedCall');
		}
	});

	// Отправка приглашения в игру Steam
	socket.on('sendGameInvite', async (data: IGameInvite) => {
		if (!data || typeof data.to !== 'string') return;

		const { to, gameName, appId, lobbyId } = data;

		try {
			const gameAvatarUrl = appId
				? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
				: null;

			// Создаем запись в БД
			const inviteMessage = await Message.create({
				sender: userId,
				recipient: to,
				text: `Приглашает вас сыграть в ${gameName}!`,
				type: 'invite',
				gameData: {
					gameName,
					appId,
					lobbyId,
					gameAvatarUrl,
				},
			});

			// Если друг онлайн, то отправляем ему приглашение в игру
			const targetSocketId = getReceiverSocketId(to);

			if (targetSocketId.length > 0) {
				io.to(targetSocketId).emit('newMessage', inviteMessage);
			}

			// Отправляем сообщение обратно отправителю
			const mySocketId = getReceiverSocketId(userId);

			if (mySocketId.length > 0) {
				io.to(mySocketId).emit('newMessage', inviteMessage);
			}
		} catch (err: unknown) {
			console.error('Ошибка при обработке отправки приглашения:', err);
		}
	});

	// "Тихая" маршрутизация WebRTC
	socket.on('silentSignal', (data) => {
		if (!data || typeof data.to !== 'string') return;

		const { to, signal } = data;
		const targetSocketId = getReceiverSocketId(to);

		if (targetSocketId.length > 0) {
			io.to(targetSocketId).emit('silentSignal', { signal });
		}
	});

	// Отключение
	socket.on('disconnect', () => {
		// Удаляем пользователя из объекта при его отключении
		if (userId && userSocketMap[userId]) {
			userSocketMap[userId].delete(socket.id);
			if (userSocketMap[userId].size === 0) {
				delete userSocketMap[userId];

				// Очищаем статус игры и оповещаем остальных пользователей
				if (gameStatusCache.has(userId)) {
					gameStatusCache.delete(userId);
					io.emit('gameStatusChanged', {
						userId: userId,
						currentGame: null,
						appId: null,
						lobbyId: null,
						gameAvatarUrl: null,
					});
				}

				// Если у пользователя не осталось активных вкладок -> удаляем его активные звонки
				for (const [key, call] of activeCallsMap.entries()) {
					if (call.initiatorId === userId || call.recipientId === userId) {
						activeCallsMap.delete(key);

						const otherId =
							call.initiatorId === userId ? call.recipientId : call.initiatorId;
						const otherSocketId = getReceiverSocketId(otherId);

						if (otherSocketId.length > 0) {
							io.to(otherSocketId).emit('completedCall');
						}
					}
				}
			}
		}

		// Отправляем обновленный список
		io.emit('getOnlineUsers', Object.keys(userSocketMap));
	});
});

// Запуск поллинга Steam
if (process.env.NODE_ENV !== 'test') {
	startSteamPolling(io, () => Object.keys(userSocketMap));
}

export { app, io, server };
