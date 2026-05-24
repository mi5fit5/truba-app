import cron from 'node-cron';
import { Server } from 'socket.io';
import User from '../models/User';

interface ISteamPlayerSummary {
	steamid: string; // Steam ID
	gameextrainfo?: string; // Название игры
	gameid?: string; // ID игры
	lobbysteamid?: string; // ID лобби
}

// Объект с данными для кэша
interface IGameStatus {
	gameName: string | null;
	appId: string | null;
	lobbyId: string | null;
	gameAvatarUrl: string | null;
}

// Кэш для хранения текущей игры
export const gameStatusCache = new Map<string, IGameStatus | null>();

// Вспомогательная функция для сравнения двух статусов
const hasStatusChanged = (
	curr: IGameStatus | null,
	prev?: IGameStatus | null
) => {
	if (!curr && !prev) return false;
	if (!curr || !prev) return true;
	return (
		curr.gameName !== prev.gameName ||
		curr.appId !== prev.appId ||
		curr.lobbyId !== prev.lobbyId
	);
};

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

				// Собираем актуальные данные из ответа Steam
				const currentStatus: IGameStatus | null = player.gameextrainfo
					? {
							gameName: player.gameextrainfo,
							appId: player.gameid || null,
							lobbyId: player.lobbysteamid || null,
							gameAvatarUrl: player.gameid
								? `https://cdn.cloudflare.steamstatic.com/steam/apps/${player.gameid}/header.jpg`
								: null,
						}
					: null;

				// Достаем прошлый статус из кэша
				const previousStatus = gameStatusCache.get(String(user._id));

				// Если статус игры или лобби изменился
				if (hasStatusChanged(currentStatus, previousStatus)) {
					gameStatusCache.set(String(user._id), currentStatus); // Обновляем кэш

					io.emit('gameStatusChanged', {
						// Отправляем информацию об изменении
						userId: String(user._id),
						currentGame: currentStatus?.gameName || null,
						appId: currentStatus?.appId || null,
						lobbyId: currentStatus?.lobbyId || null,
						gameAvatarUrl: currentStatus?.gameAvatarUrl || null,
					});
				}
			});
		} catch (err: unknown) {
			console.error('Ошибка при запросе к Steam:', err);
		}
	});
};
