import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import FriendRequest from '../models/FriendRequest';
import User from '../models/User';

// Получение данных текущего пользователя
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
	const userId = req.user?._id;

	try {
		const user = await User.findById(userId);

		if (!user) {
			return res
				.status(404)
				.json({ message: 'Пользователь по данному id не найден' });
		}

		return res.status(200).json({ user });
	} catch (err: unknown) {
		console.error('Ошибка при получении данных пользователя:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Получение списка друзей текущего пользователя
export const getCurrentUserFriends = async (
	req: AuthRequest,
	res: Response
) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Вы не авторизованы' });
		}

		const userId = req.user._id;
		const user = await User.findById(userId)
			.select('friends')
			.populate('friends', 'username avatar email'); // Подтягиваем данные друзей

		if (!user) {
			return res.status(404).json({ message: 'Пользователь не найден' });
		}

		res.status(200).json(user.friends);
	} catch (err: unknown) {
		console.error('Ошибка при получении списка друзей:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Отправка запроса в друзья
export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Вы не авторизованы' });
		}

		const senderId = req.user._id; // Id отправителя
		const targetUsername = req.params.id as string; // Никнейм получателя

		// Ищем пользователя по никнейму
		const recipient = await User.findOne({ username: targetUsername });

		if (!recipient) {
			return res.status(404).json({ message: 'Пользователь не найден' });
		}

		const recipientId = recipient._id.toString();

		if (senderId.toString() === recipientId) {
			return res.status(400).json({
				message: 'Вы не можете отправить запрос в друзья самому себе',
			});
		}

		// Проверка на наличие данного пользователя в списке своих друзей
		const isAlreadyFriend = recipient.friends.some(
			(friendId) => friendId.toString() === senderId
		);

		if (isAlreadyFriend) {
			return res.status(400).json({
				message: 'Данный пользователь уже имеется в вашем списке друзей',
			});
		}

		// Проверка на предварительную отправку запроса (в ОБЕ стороны!)
		const existingRequest = await FriendRequest.findOne({
			$or: [
				{ sender: senderId, recipient: recipientId },
				{ sender: recipientId, recipient: senderId },
			],
		});

		if (existingRequest) {
			return res.status(400).json('Заявка в друзья уже отправлена');
		}

		// Создаем новый запрос в БД
		const newFriendRequest = await FriendRequest.create({
			sender: senderId,
			recipient: recipientId,
			status: 'pending',
		});

		res.status(201).json(newFriendRequest);
	} catch (err: unknown) {
		console.error('Ошибка при отправке запроса в друзья:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Принятие запроса дружбы
export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Вы не авторизованы' });
		}

		const userId = req.user._id;
		const requestId = req.params.id;
		const friendRequest = await FriendRequest.findById(requestId);

		if (!friendRequest) {
			return res.status(404).json({ message: 'Заявка в друзья не найдена' });
		}

		// Проверка прав на это действие
		if (friendRequest.recipient.toString() !== userId) {
			return res
				.status(403)
				.json({ message: 'У вас нет прав для этого действия' });
		}

		// Проверка на принятие заявки ранее
		if (friendRequest.status === 'accepted') {
			return res.status(400).json({ message: 'Заявка уже была принята ранее' });
		}

		// Оставляем заявку в истории
		friendRequest.status = 'accepted';
		await friendRequest.save();

		// Добавляем в друзья (с ОБЕИХ сторон!)
		await Promise.all([
			User.findByIdAndUpdate(friendRequest.sender, {
				$addToSet: { friends: friendRequest.recipient },
			}),
			User.findByIdAndUpdate(friendRequest.recipient, {
				$addToSet: { friends: friendRequest.sender },
			}),
		]);

		res.status(200).json({
			message: 'Запрос дружбы принят',
			senderId: friendRequest.sender,
		});
	} catch (err: unknown) {
		console.error('Ошибка при принятии заявки в друзья:', err);
		return res.status(500).json('Ошибка сервера');
	}
};

// Отклонение запроса дружбы
export const rejectFriendRequest = async (req: AuthRequest, res: Response) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Вы не авторизованы' });
		}

		const userId = req.user._id;
		const requestId = req.params.id;
		const friendRequest = await FriendRequest.findById(requestId);

		if (!friendRequest) {
			return res.status(404).json({ message: 'Заявка в друзья не найдена' });
		}

		// Проверка прав на это действие
		if (
			friendRequest.sender.toString() !== userId &&
			friendRequest.recipient.toString() !== userId
		) {
			return res
				.status(403)
				.json({ message: 'У вас нет прав для этого действия' });
		}

		// Удаляем запрос
		await FriendRequest.findByIdAndDelete(requestId);

		res.status(200).json({ message: 'Заявка в друзья отклонена' });
	} catch (err: unknown) {
		console.error('Ошибка при отклонении заявки в друзья:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Получение списка входящих заявок в друзья
export const getIncomingFriendRequests = async (
	req: AuthRequest,
	res: Response
) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Вы не авторизованы' });
		}

		const userId = req.user._id;

		// Заявки там, где мы получатель и они ещё не приняты
		const incomingRequests = await FriendRequest.find({
			recipient: userId,
			status: 'pending',
		}).populate('sender', 'username avatar email'); // Подтягиваем данные отправителя

		res.status(200).json(incomingRequests);
	} catch (err: unknown) {
		console.error('Ошибка при получении заявок:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};
