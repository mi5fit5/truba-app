import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import type { TFriendRequest, TIncomingCall } from '@types';
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
	setCurrentUserGameStatus,
	setFriendGameStatus,
	updateFriendProfile,
	addIncomingRequest,
	fetchFriends,
} from '@slices';
import { playSystemSound } from '@utils/audioUtils';

import { messageSound } from '@audio';

// Хук для подключения сокета и слушателей
export const useSocket = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector(selectUserData);
	const callStatus = useSelector(selectCallStatus);
	const activeFriendId = useSelector(selectActiveFriendId);
	const isCallChatOpen = useSelector(selectIsChatOpen);

	const currentUserId = currentUser?._id;

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
		if (!currentUserId) return;

		// Устанавливаем связь с сервером
		const newSocket = io('/', {
			withCredentials: true,
		});

		newSocket.on('connect', () => {
			setSocket(newSocket); // Записываем активное подключение в стейт
		});

		newSocket.on('connect_error', (err) => {
			console.error('Ошибка подключения к серверу:', err.message);
		});

		// Онлайн-статусы
		newSocket.on('getOnlineUsers', (users: string[]) => {
			dispatch(setOnlineUsers(users));
		});

		// Обновление профилей
		newSocket.on(
			'userProfileUpdated',
			(data: { userId: string; avatar: string; bio: string }) => {
				if (currentUserId !== data.userId) {
					dispatch(updateFriendProfile(data));
				}
			}
		);

		// Изменения игрового статуса
		newSocket.on(
			'gameStatusChanged',
			(data: {
				userId: string;
				currentGame: string | null;
				appId: string | null;
				lobbyId: string | null;
				gameAvatarUrl: string | null;
			}) => {
				if (currentUserId === data.userId) {
					dispatch(
						setCurrentUserGameStatus({
							currentGame: data.currentGame,
							appId: data.appId,
							lobbyId: data.lobbyId,
							gameAvatarUrl: data.gameAvatarUrl,
						})
					);
				} else {
					dispatch(setFriendGameStatus(data));
				}
			}
		);

		// Новые сообщения
		newSocket.on('newMessage', (message) => {
			dispatch(addMessage(message)); // Добавляем сообщение в историю чата без перезагрузки

			// Звук нового сообщения (если не открыт чат с другом / чат в модалке активного звонка)
			const isFromActiveFriend = message.sender === activeFriendIdRef.current;
			const isCurrentUser = message.sender === currentUserId;
			const isModalActive =
				statusRef.current === 'connected' || statusRef.current === 'calling';

			if (
				!isCurrentUser &&
				message.type !== 'system' &&
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

		// Звонок принят на другом устройстве/вкладке
		newSocket.on('callAnsweredSomewhereElse', () => {
			dispatch(endCall());
		});

		// Пришла заявка в друзья
		newSocket.on('newFriendRequest', (newRequest: TFriendRequest) => {
			dispatch(addIncomingRequest(newRequest));
			playSystemSound(messageSound);
		});

		// Заявка дружбы принята другим пользователем
		newSocket.on('friendRequestAccepted', () => {
			dispatch(fetchFriends());
			playSystemSound(messageSound);
		});

		// Удаление из списка друзей
		newSocket.on('friendRemoved', () => {
			dispatch(fetchFriends());
		});

		return () => {
			newSocket.close(); // Закрываем соединение
			setSocket(null); // Очищаем стейт при размонтировании
		};
	}, [currentUserId, dispatch]);

	return socket; // Возвращаем стейт
};
