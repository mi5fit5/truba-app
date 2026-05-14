import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';

interface ChangePasswordBody {
	oldPassword?: string;
	newPassword?: string;
}

// Регистрация нового пользователя
export const registerUser = async (req: Request, res: Response) => {
	try {
		const { username, email, password, avatar } = req.body;

		// Хеширование пароля
		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash(password, salt);

		const newUser = await User.create({
			username,
			email,
			avatar,
			password: passwordHash,
			friends: [],
		});

		// Создаем токен
		const token = jwt.sign(
			{ _id: newUser._id },
			process.env.JWT_SECRET_KEY as string,
			{ expiresIn: '7d' }
		);

		// Убираем хеш пароля
		const { password: _, ...userData } = newUser.toObject();

		return res
			.status(201)
			.cookie('jwt', token, {
				httpOnly: true,
				sameSite: true,
				maxAge: 7 * 24 * 3600 * 1000,
			})
			.json({ message: 'Регистрация выполнена успешно ', user: userData });
	} catch (err: unknown) {
		// Ошибка валидации
		if (err instanceof Error && err.name === 'ValidationError') {
			return res.status(400).json({
				message: 'Переданы некорректные данные при создании пользователя',
			});
		}

		// Ошибка уникальности
		if (err instanceof Error && 'code' in err && err.code === 11000) {
			return res.status(409).json({
				message: 'Пользователь с таким email или никнеймом уже существует',
			});
		}

		console.error('Ошибка при регистрации пользователя:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Вход пользователя
export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email }).select('+password');

		// Проверка совпадения пользователя
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ message: 'Неправильный email или пароль' });
		}

		// Создаем токен
		const token = jwt.sign(
			{ _id: user._id },
			process.env.JWT_SECRET_KEY as string,
			{ expiresIn: '7d' }
		);

		// Убираем хеш пароля
		const { password: _, ...userData } = user.toObject();

		// Установка куки и отправка данных пользователя
		return res
			.cookie('jwt', token, {
				httpOnly: true,
				sameSite: true,
				maxAge: 7 * 24 * 3600 * 1000,
			})
			.status(200)
			.json({ message: 'Вход выполнен успешно ', user: userData });
	} catch (err: unknown) {
		console.error('Ошибка при логине пользователя:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};

// Выход пользователя
export const logout = (req: Request, res: Response) => {
	res.clearCookie('jwt', {
		httpOnly: true,
		sameSite: true,
	});

	return res.status(200).json({ message: 'Выход выполнен успешно' });
};

// Смена пароля
export const changePassword = async (req: AuthRequest, res: Response) => {
	try {
		const { oldPassword, newPassword } = req.body as ChangePasswordBody;

		if (!req.user || !req.user._id) {
			return res.status(401).json({ message: 'Вы не авторизованы' });
		}

		const userId = req.user._id;

		if (!oldPassword || !newPassword) {
			return res.status(400).json({ message: 'Заполните все поля' });
		}

		if (oldPassword === newPassword) {
			return res
				.status(400)
				.json({ message: 'Новый пароль должен отличаться от текущего' });
		}

		const user = await User.findById(userId).select('+password');

		if (!user) {
			return res.status(404).json({ message: 'Пользователь не найден' });
		}

		// Сверяем пароли
		const isMatch = await bcrypt.compare(oldPassword, user.password);

		if (!isMatch) {
			return res.status(400).json({ message: 'Неверный текущий пароль' });
		}

		// Хешируем и сохраняем новый пароль
		const salt = await bcrypt.genSalt(10);
		const newPasswordHash = await bcrypt.hash(newPassword, salt);

		user.password = newPasswordHash;
		await user.save();

		return res.status(200).json({ message: 'Пароль успешно изменен' });
	} catch (err: unknown) {
		console.error('Ошибка при смене пароля:', err);
		return res.status(500).json({ message: 'Ошибка сервера' });
	}
};
