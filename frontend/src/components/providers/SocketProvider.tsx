import type React from 'react';
import { SocketContext } from '@context';
import { useSocket } from '@hooks';

interface SocketProviderProps {
	children: React.ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
	const socket = useSocket();

	return (
		<SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
	);
};
