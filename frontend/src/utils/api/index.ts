import axios from 'axios';
import { authRequests } from './authRequests';
import { chatRequests } from './chatRequests';
import { friendsRequests } from './friendsRequests';

// Создаем экземпляр axios с настройками
export const api = axios.create({
	baseURL: '/api',
	withCredentials: true,
});

export { authRequests, chatRequests, friendsRequests };
