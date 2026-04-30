import { createContext, useContext } from 'react';
import { usePeerConnection } from '@hooks';

// Типизируем контекст на основе возвращаемого значения хука
type TPeerContext = ReturnType<typeof usePeerConnection>;

// Контекст для хранения функционала подключения
export const PeerContext = createContext<TPeerContext | null>(null);

// Хук для доступа к контексту
export const usePeerContext = () => {
	const context = useContext(PeerContext);
	if (!context) {
		throw new Error('Ошибка доступа к контексту!');
	}
	return context;
};
