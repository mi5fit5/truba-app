import { api } from './index';

// Объект с запросами
export const friendsRequests = {
	// Получить список друзей
	getFriends: () => api.get('/users/friends'),

	// Получить список поступаюших запросов дружбы
	getIncomingRequests: () => api.get('/users/friend-requests'),

	// Отправить запрос дружбы
	sendRequest: (username: string) =>
		api.post(`/users/friend-request/${username}`),

	// Принять запросы дружбы
	acceptRequest: (requestId: string) =>
		api.put(`/users/friend-request/${requestId}/accept`),

	// Отклонить запрос дружбы
	rejectRequest: (requestId: string) =>
		api.delete(`/users/friend-request/${requestId}`),
};
