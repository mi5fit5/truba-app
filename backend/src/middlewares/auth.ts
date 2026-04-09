import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
	user?: JwtPayload & { _id: string };
}

// Проверка подлинности пользователя перед тем, как запрос дойдёт до маршрута
export const authMiddleware = (
	req: AuthRequest,
	res: Response,
	next: NextFunction
) => {
	const token = req.cookies.jwt;

	if (!token) {
		return res
			.status(401)
			.json({ message: 'Похоже, что у вас нет доступа 😞' });
	}

	try {
		// Расшифровка токена
		const decodedToken = jwt.verify(
			token,
			process.env.JWT_SECRET_KEY as string
		) as JwtPayload & { _id: string };

		// Записываем данные в объект запроса
		req.user = decodedToken;

		next();
	} catch (err) {
		console.error('Ошибка:', err);
		return res.status(401).json({ message: 'Неверный токен' });
	}
};
