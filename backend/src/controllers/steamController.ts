import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import User from '../models/User';

// Получение данных Steam профиля
const fetchSteamData = async (steamId: string) => {
	const steamResponse = await fetch(
		`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
	);

	if (!steamResponse.ok) {
		throw new Error('Ошибка ответа от Steam');
	}

	const steamData = await steamResponse.json();
	const userInfo = steamData.response.players[0];

	if (!userInfo) {
		throw new Error('Профиль Steam не найден');
	}

	return {
		steamName: userInfo.personaname, // Имя
		profileUrl: userInfo.profileurl, // Ссылка на профиль
		avatar: userInfo.avatarfull, // Аватар
		onlineState: userInfo.personastate, // Статус сети
		currentGame: userInfo.gameextrainfo, // Текущая запущенная игра
	};
};

// Получение профиля ТЕКУЩЕГО пользователя
export const getSteamProfile = async (req: AuthRequest, res: Response) => {
	try {
		const userId = req.user?._id;

		if (!userId) {
			return res.status(401).json({ message: 'Вы не авторизованы' });
		}

		const user = await User.findById(userId);

		if (!user || !user.steamId) {
			return res.status(404).json({ message: 'Steam не привязан' });
		}

		const data = await fetchSteamData(user.steamId);

		return res.status(200).json(data);
	} catch (err: unknown) {
		console.error('Ошибка при запросе к Steam:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Получение профиля ДРУГА
export const getFriendSteamProfile = async (
	req: AuthRequest,
	res: Response
) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId);

		if (!user || !user.steamId) {
			return res.status(404).json({ message: 'Steam не привязан' });
		}

		const data = await fetchSteamData(user.steamId);
		return res.status(200).json(data);
	} catch (err: unknown) {
		console.error('Ошибка при получении профиля Steam:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Отвязка Steam от аккаунта
export const unlinkSteam = async (req: AuthRequest, res: Response) => {
	try {
		const userId = req.user?._id;

		if (!userId) {
			return res.status(401).json({ message: 'Пользователь не авторизованы' });
		}

		// Заменяем Steam ID на null
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ steamId: null },
			{ returnDocument: 'after' }
		);

		if (!updatedUser) {
			return res.status(404).json({ message: 'Пользователь не найден' });
		}

		return res.status(200).json({
			message: 'Steam аккаунт успешно отвязан',
			user: updatedUser,
		});
	} catch (err: unknown) {
		console.error('Ошибка при отвязке Steam:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};
