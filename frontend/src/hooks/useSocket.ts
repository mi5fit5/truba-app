import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { useDispatch, useSelector } from '@store';
import { selectUserData, setOnlineUsers, addMessage } from '@slices';

// Контекст для передачи сокета по всему приложению
export const SocketContext = createContext<Socket | null>(null);

// Хук для быстрого получения сокета
export const useSocketInstance = () => {
	return useContext(SocketContext);
};

// Хук для подключения сокета и слушателей
export const useSocket = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector(selectUserData);

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
		});

		return () => {
			newSocket.close(); // Закрываем соединение
			setSocket(null); // Очищаем стейт при размонтировании
		};
	}, [currentUser, dispatch]);

	return socket; // Возвращаем стейт
};
