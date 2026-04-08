import axios from 'axios';

// Создаем экземпляр axios с настройками
export const api = axios.create({
	baseURL: '/api',
	withCredentials: true,
});
