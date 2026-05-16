import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import User from '../models/User';

// Получение профиля Steam любого пользователя
export const getUserSteamProfileById = async (
	req: AuthRequest,
	res: Response
) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId);

		if (!user || !user.steamId) {
			return res.status(404).json({ message: 'Steam не привязан' });
		}

		const steamResponse = await fetch(
			`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${user.steamId}`
		);

		if (!steamResponse.ok) {
			throw new Error('Ошибка ответа от Steam');
		}

		const steamData = await steamResponse.json();
		const playerInfo = steamData.response.players[0];

		if (!playerInfo) {
			return res.status(404).json({ message: 'Профиль Steam не найден' });
		}

		// Возвращаем данные Steam
		return res.status(200).json({
			steamName: playerInfo.personaname, // Имя
			profileUrl: playerInfo.profileurl, // Ссылка на профиль
			avatar: playerInfo.avatarfull, // Аватар
			onlineState: playerInfo.personastate, // Статус сети
			currentGame: playerInfo.gameextrainfo, // Текущая запущенная игра
		});
	} catch (err: unknown) {
		console.error('Ошибка при запросе к Steam API:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};
