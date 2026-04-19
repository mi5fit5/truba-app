import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Message from '../models/Message';

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

		// TODO: Добавить логику Socket.IO

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
