import { api } from './index';

// Объект с запросами
export const chatRequests = {
	// Получить историю сообщений в чате с другом
	getChatHistory: (friendId: string) => api.get(`/messages/${friendId}`),

	// Отправить новое сообщение
	sendMessage: (friendId: string, text: string) =>
		api.post(`/messages/send/${friendId}`, { text }),

	// Поиск сообщений
	searchMessages: (friendId: string, text: string) =>
		api.get(`/messages/${friendId}/search?text=${text}`),
};
