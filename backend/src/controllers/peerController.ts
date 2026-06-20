import type { Request, Response } from 'express';

// Типизация ICE-сервера
type IceServer = {
	urls: string | string[];
	username?: string;
	credential?: string;
};

// Получение конфигурации ICE-серверов (STUN/TURN) для WebRTC
export const getIceServers = async (_req: Request, res: Response) => {
	const turnServerIp = process.env.TURN_SERVER_IP;
	const turnUsername = process.env.TURN_USERNAME;
	const turnPassword = process.env.TURN_PASSWORD;

	const iceServers: IceServer[] = [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:global.stun.twilio.com:3478' },
	];

	if (turnServerIp && turnUsername && turnPassword) {
		iceServers.push({
			urls: [
				`turn:${turnServerIp}:443`,
				`turn:${turnServerIp}:443?transport=tcp`,
			],
			username: turnUsername,
			credential: turnPassword,
		});
	}

	return res.json(iceServers);
};
