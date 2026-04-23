import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDispatch, useSelector } from '../services/store';
import { selectUserData } from '../services/slices/userSlice';
import { setOnlineUsers } from '../services/slices/friendsSlice';
import { addMessage } from '../services/slices/chatSlice';

export const useSocket = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector(selectUserData);

	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		if (!currentUser) return;

		// Устанавливаем связь с сервером
		const newSocket = io('http://localhost:3000', {
			query: {
				userId: currentUser._id, // Передаём id пользователя
			},
		});

		// Записываем активное подключение в реф
		socketRef.current = newSocket;

		// Слушаем рассылку со списком онлайн-пользователей
		newSocket.on('getOnlineUsers', (users: string[]) => {
			dispatch(setOnlineUsers(users));
		});

		// Слушаем личные сообщения
		newSocket.on('newMessage', (message) => {
			dispatch(addMessage(message)); // Добавляем сообщение в историю чата без перезагрузки
		});

		return () => {
			newSocket.close(); // Закрываем соединение
			socketRef.current = null; // Очищаем реф
		};
	}, [currentUser, dispatch]);
};
