import axios from 'axios';
import { authRequests } from './authRequests';
import { chatRequests } from './chatRequests';
import { friendsRequests } from './friendsRequests';
import { steamRequests } from './steamRequests';

// Создаем экземпляр axios с настройками
export const api = axios.create({
	baseURL: '/api',
	withCredentials: true,
});

export { authRequests, chatRequests, friendsRequests, steamRequests };
