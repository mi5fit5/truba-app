import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import type { TIncomingCall } from '@types';
import { useDispatch, useSelector } from '@store';
import {
	selectUserData,
	setOnlineUsers,
	addMessage,
	receiveCall,
	endCall,
	selectCallStatus,
	updatePeerMedia,
	selectActiveFriendId,
	selectIsChatOpen,
} from '@slices';
import { playSystemSound } from '@utils/audioUtils';

import { declineCallSound, messageSound } from '@audio';

// Хук для подключения сокета и слушателей
export const useSocket = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector(selectUserData);
	const callStatus = useSelector(selectCallStatus);
	const activeFriendId = useSelector(selectActiveFriendId);
	const isCallChatOpen = useSelector(selectIsChatOpen);

	const statusRef = useRef(callStatus);
	const activeFriendIdRef = useRef(activeFriendId);
	const isCallChatOpenRef = useRef(isCallChatOpen);

	// Синхронизация с Redux
	useEffect(() => {
		statusRef.current = callStatus;
		activeFriendIdRef.current = activeFriendId;
		isCallChatOpenRef.current = isCallChatOpen;
	}, [callStatus, activeFriendId, isCallChatOpen]);

	// Хранение сокета
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		if (!currentUser) return;

		// Устанавливаем связь с сервером
		const newSocket = io('http://localhost:3000', {
			query: {
				userId: currentUser._id, // Передаём id пользователя
			},
		});

		newSocket.on('connect', () => {
			setSocket(newSocket); // Записываем активное подключение в стейт
		});

		// Онлайн-статусы
		newSocket.on('getOnlineUsers', (users: string[]) => {
			dispatch(setOnlineUsers(users));
		});

		// Новые сообщения
		newSocket.on('newMessage', (message) => {
			dispatch(addMessage(message)); // Добавляем сообщение в историю чата без перезагрузки

			// Звук нового сообщения (если не открыт чат с другом / чат в модалке активного звонка)
			const isFromActiveFriend = message.sender === activeFriendIdRef.current;
			const isCurrentUser = message.sender === currentUser._id;
			const isModalActive =
				statusRef.current === 'connected' || statusRef.current === 'calling';

			if (
				!isCurrentUser &&
				(!isFromActiveFriend || (isModalActive && !isCallChatOpenRef.current))
			) {
				playSystemSound(messageSound);
			}
		});

		// Изменения медиа от собеседника
		newSocket.on(
			'peerMediaToggled',
			(data: { type: 'audio' | 'video'; isMuted: boolean }) => {
				dispatch(updatePeerMedia(data));
			}
		);

		// Входящий звонок
		newSocket.on('incomingCall', (data: TIncomingCall) => {
			dispatch(receiveCall(data));
		});

		// Звонок завершён или сброшен собеседником
		newSocket.on('completedCall', () => {
			if (
				statusRef.current === 'calling' ||
				statusRef.current === 'receiving'
			) {
				playSystemSound(declineCallSound);
			}

			dispatch(endCall());
		});

		return () => {
			newSocket.close(); // Закрываем соединение
			setSocket(null); // Очищаем стейт при размонтировании
		};
	}, [currentUser, dispatch]);

	return socket; // Возвращаем стейт
};
