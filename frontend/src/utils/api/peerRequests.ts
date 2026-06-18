import { api } from './index';

// Объект с запросами
export const peerRequests = {
	// Получение ICE-конфигурации (STUN/TURN)
	getIceServers: () => api.get<RTCIceServer[]>('/peer/ice-servers'),
};
