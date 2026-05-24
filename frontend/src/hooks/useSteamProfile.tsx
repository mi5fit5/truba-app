import axios from 'axios';
import { useState, useCallback } from 'react';

import type { TSteamProfile } from '@types';

import { steamRequests } from '@utils-api';
import { getErrorMessage } from '@utils/getErrorMessage';

// Хук для работы с профилем Steam
export const useSteamProfile = () => {
	// Стейты для хранения
	const [steamProfile, setSteamProfile] = useState<TSteamProfile | null>(null);
	const [isLoadingSteam, setIsLoadingSteam] = useState(false);
	const [isUnlinking, setIsUnlinking] = useState(false);
	const [steamError, setSteamError] = useState<string | null>(null);

	// Получения профиля
	const fetchSteamProfile = useCallback(async (userId?: string) => {
		setIsLoadingSteam(true);
		setSteamError(null);

		try {
			const steamData = userId
				? await steamRequests.getFriendProfile(userId)
				: await steamRequests.getCurrentUserProfile();

			setSteamProfile(steamData);
		} catch (err: unknown) {
			if (axios.isAxiosError(err) && err.response?.status === 404) {
				setSteamProfile(null);
				setSteamError(null);
			} else {
				console.error('Ошибка при загрузке Steam:', err);
				setSteamError(getErrorMessage(err));
			}
		} finally {
			setIsLoadingSteam(false);
		}
	}, []);

	// Отвязка профиля
	const unlinkSteamProfile = useCallback(async () => {
		setIsUnlinking(true);

		// Очищаем данные локально
		setSteamError(null);
		setSteamProfile(null);
		setSteamError(null);

		try {
			await steamRequests.unlinkSteam();
		} catch (err: unknown) {
			console.error('Ошибка при отвязке Steam:', err);
			setSteamError('Не удалось отвязать Steam аккаунт');
			throw err;
		} finally {
			setIsUnlinking(false);
		}
	}, []);

	return {
		steamProfile,
		isLoadingSteam,
		isUnlinking,
		steamError,
		fetchSteamProfile,
		unlinkSteamProfile,
	};
};
