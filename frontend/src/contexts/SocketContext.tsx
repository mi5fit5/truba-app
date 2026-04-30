import { createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';

// Контекст для передачи сокета по всему приложению
export const SocketContext = createContext<Socket | null>(null);

// Хук для доступа к контексту
export const useSocketInstance = () => {
	const socket = useContext(SocketContext);
	return socket;
};
