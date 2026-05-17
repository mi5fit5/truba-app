import { api } from '@utils-api';
import type { TSteamProfile } from '@types';

export const steamRequests = {
	// Получить профиль Steam текущего пользователя
	getCurrentUserProfile: () => {
		return api
			.get<TSteamProfile>('/auth/steam/profile')
			.then((res) => res.data);
	},

	// Получить профиль друга
	getFriendProfile: (userId: string) => {
		return api
			.get<TSteamProfile>(`/auth/steam/${userId}/steam`)
			.then((res) => res.data);
	},

	// Отвязка Steam
	unlinkSteam: () => {
		return api.delete('/auth/steam').then((res) => res.data);
	},
};
