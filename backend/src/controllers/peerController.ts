import type { Request, Response } from 'express';

// Получение конфигурации ICE-серверов (STUN/TURN) для WebRTC
export const getIceServers = async (_req: Request, res: Response) => {
	const apiKey = process.env.TURN_API_KEY;
	const domain = process.env.TURN_DOMAIN;

	// Перенаправление на публичные STUN-сервера, если TURN не настроен
	if (!apiKey || !domain) {
		return res.json([
			{ urls: 'stun:stun.l.google.com:19302' },
			{ urls: 'stun:global.stun.twilio.com:3478' },
		]);
	}

	try {
		const response = await fetch(
			`https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`
		);

		if (!response.ok) {
			throw new Error(`Ошибка TURN-сервера: ${response.status}`);
		}

		const iceServers = await response.json();

		return res.json(iceServers);
	} catch (err: unknown) {
		console.error('Ошибка получения TURN-credentials:', err);

		// Перенаправление на публичные STUN-сервера, если возникла ошибка
		return res.json([
			{ urls: 'stun:stun.l.google.com:19302' },
			{ urls: 'stun:global.stun.twilio.com:3478' },
		]);
	}
};
