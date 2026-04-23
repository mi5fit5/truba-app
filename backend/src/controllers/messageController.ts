import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Message from '../models/Message';
import { getReceiverSocketId, io } from '../lib/socket';

// Отправка нового сообщения
export const sendMessage = async (req: AuthRequest, res: Response) => {
	try {
		const { text } = req.body;
		const senderId = req.user?._id;
		const recipientId = req.params.id as string;

		if (!text || text.trim() === '') {
			return res
				.status(400)
				.json({ message: 'Текст сообщения не может быть пустым' });
		}

		// Создаем новое сообщение в БД
		const newMessage = await Message.create({
			sender: senderId,
			recipient: recipientId,
			text: text.trim(),
		});

		// Моментальная отправка сообщений
		const receiverSocketId = getReceiverSocketId(recipientId);

		if (receiverSocketId) {
			io.to(receiverSocketId).emit('newMessage', newMessage); // Только конкретному пользователю
		}

		return res.status(201).json(newMessage);
	} catch (err: unknown) {
		console.error('Ошибка при отправке сообщения:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Получение истории сообщений с конкретным пользователем
export const getChatHistory = async (req: AuthRequest, res: Response) => {
	try {
		const currentUserId = req.user?._id;
		const friendId = req.params.id;

		// Полная переписка между двумя людьми
		const messages = await Message.find({
			$or: [
				{ sender: currentUserId, recipient: friendId },
				{ sender: friendId, recipient: currentUserId },
			],
		}).sort({ createdAt: 1 }); // Сортировка сообщений от старых к новым

		return res.status(200).json(messages);
	} catch (err: unknown) {
		console.error('Ошибка при загрузке истории сообщений:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Поиск сообщений по истории чата
export const searchMessages = async (req: AuthRequest, res: Response) => {
	try {
		const currentUserId = req.user?._id;
		const friendId = req.params.id;
		const searchQuery = req.query.text as string;

		// Поиск между двумя конкретными пользователями
		const messages = await Message.find({
			$or: [
				{ sender: currentUserId, recipient: friendId },
				{ sender: friendId, recipient: currentUserId },
			],
			text: { $regex: searchQuery, $options: 'i' }, // Совпадения по тексту + нечувствительность к регистру
		}).sort({ createdAt: 1 });

		return res.status(200).json(messages);
	} catch (err: unknown) {
		console.error('Ошибка при поиске сообщений:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};
