import { api } from './api';
import type { TLoginData, TRegisterData } from '../types';

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
		return api.get('/auth/user/me').then((res) => res.data);
	},
};
