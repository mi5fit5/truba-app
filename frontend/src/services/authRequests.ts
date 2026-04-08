import { api } from './api';
import type { LoginData, RegisterData } from '../types';

// Объект с запросами
export const authRequests = {
	// Регистрация
	register: (data: RegisterData) => {
		return api.post('/auth/register', data).then((res) => res.data);
	},

	// Вход
	login: (data: LoginData) => {
		return api.post('/auth/login', data).then((res) => res.data);
	},

	// Выход
	logout: () => {
		return api.post('/auth/logout').then((res) => res.data);
	},
};
