import express from 'express';
import passport from 'passport';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import {
	getSteamProfile,
	getFriendSteamProfile,
	unlinkSteam,
} from '../controllers/steamController';

const router = express.Router();

// Инициализация привязки
router.get(
	'/',
	authMiddleware,
	(req: AuthRequest, res, next) => {
		if (req.user && req.user._id) {
			// Сохраняем ID пользователя из JWT во временную сессию
			req.session.userId = req.user._id.toString();
		}

		next();
	},
	passport.authenticate('steam', { session: false })
);

// Ответ от Steam
router.get(
	'/return',
	passport.authenticate('steam', {
		session: false,
		failureRedirect: `${process.env.CLIENT_URL}`,
	}),
	(req, res) => {
		res.redirect(`${process.env.CLIENT_URL}/?steam=success`); // Перенаправление на фронт
	}
);

// Получение данных профиля (своего и друга)
router.get('/profile', authMiddleware, getSteamProfile);
router.get('/:userId/steam', authMiddleware, getFriendSteamProfile);

// Отвязка Steam от аккаунта
router.delete('/', authMiddleware, unlinkSteam);

export default router;
