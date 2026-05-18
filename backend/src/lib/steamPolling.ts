import cron from 'node-cron';
import { Server } from 'socket.io';
import User from '../models/User';

interface ISteamPlayerSummary {
	steamid: string;
	gameextrainfo?: string;
}

// Кэш для хранения текущей игры
const gameStatusCache = new Map<string, string | null>();

export const startSteamPolling = (
	io: Server,
	getOnlineUsers: () => string[]
) => {
	cron.schedule('* * * * *', async () => {
		//  Каждую минуту!
		try {
			// Получаем массив ID тех, кто сейчас онлайн
			const onlineUserIds = getOnlineUsers();

			if (onlineUserIds.length === 0) return;

			// Ищем этих пользователей в базе (+ у них должнен быть привязан Steam)
			const users = await User.find({
				_id: { $in: onlineUserIds },
				steamId: { $ne: null },
			}).select('_id steamId');

			if (users.length === 0) return;

			// Формируем строку ID для запроса
			const steamIds = users.map((u) => u.steamId).join(',');

			const steamResponse = await fetch(
				`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamIds}`
			);

			if (!steamResponse.ok) {
				console.error('Ошибка ответа от Steam');
				return;
			}

			const steamData = await steamResponse.json();
			const players = steamData.response.players;

			players.forEach((player: ISteamPlayerSummary) => {
				const user = users.find((u) => u.steamId === player.steamid);
				if (!user) return;

				const userIdStr = user._id.toString();

				const currentGame = player.gameextrainfo || null;
				const previousGame = gameStatusCache.get(userIdStr);

				// Если статус изменился
				if (currentGame !== previousGame) {
					gameStatusCache.set(userIdStr, currentGame); // Обновляем кэш

					io.emit('gameStatusChanged', {
						// Отправляем информацию об изменении
						userId: userIdStr,
						currentGame: currentGame,
					});
				}
			});
		} catch (err: unknown) {
			console.error('Ошибка при запросе к Steam:', err);
		}
	});
};
