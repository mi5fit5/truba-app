import { api } from './index';
import type { TLoginData, TRegisterData } from '@types';

// Объект с запросами
export const authRequests = {
	// Регистрация
	register: (data: TRegisterData) => {
		return api.post('/auth/register', data).then((res) => res.data);
	},

	// Вход
	login: (data: TLoginData) => {
		return api.post('/auth/login', data).then((res) => res.data);
	},

	// Выход
	logout: () => {
		return api.post('/auth/logout').then((res) => res.data);
	},

	// Получение данных текущего пользователя
	getUser: () => {
		return api.get('/users/me').then((res) => res.data);
	},
};
