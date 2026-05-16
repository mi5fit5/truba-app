import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import dotenv from 'dotenv';
import 'express-session';
import User from '../models/User';

dotenv.config();

// Сериализация
passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((obj: unknown, done) => {
	done(null, obj as Express.User);
});

passport.use(
	new SteamStrategy(
		{
			returnURL: `${process.env.SERVER_URL}/api/auth/steam/return`,
			realm: `${process.env.SERVER_URL}/`,
			apiKey: process.env.STEAM_API_KEY as string,
			passReqToCallback: true,
		},
		async (req, identifier, profile, done) => {
			try {
				// Берем ID пользователя из временной сессии
				const userId = req.session?.userId;

				if (!userId) {
					return done(
						new Error('Пользователь не найден. Начните привязку заново'),
						null
					);
				}

				const steamId = String(profile.id);

				const updatedUser = await User.findByIdAndUpdate(
					userId,
					{ steamId: steamId },
					{ returnDocument: 'after' }
				);

				return done(null, updatedUser);
			} catch (err: unknown) {
				return done(
					err instanceof Error ? err : new Error('Неизвестная ошибка')
				);
			}
		}
	)
);

export default passport;
