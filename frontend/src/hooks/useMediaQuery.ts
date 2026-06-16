import { useSyncExternalStore } from 'react';

// Хук для прослушивания ширины экрана
export const useMediaQuery = (query: string): boolean => {
	// Функция подписки на изменения
	const subscribe = (callback: () => void) => {
		const media = window.matchMedia(query);

		media.addEventListener('change', callback);

		return () => media.removeEventListener('change', callback);
	};

	// Функция получения текущего значения
	const getSnapshot = () => {
		return window.matchMedia(query).matches;
	};

	const getServerSnapshot = () => false;

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
