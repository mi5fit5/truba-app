import { type ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useSelector } from '../../services/store';
import {
	selectUserIsAuth,
	selectUserIsInit,
} from '../../services/slices/user/userSlice';
import { Preloader } from '../ui/Preloader';

// Типизация
type TProtectedRouteProps = {
	onlyUnAuth?: boolean; // Только для НЕавторизованных пользователей -> вход / регистрация
	children: ReactElement;
};

// Защищённый маршрут
export const ProtectedRoute = ({
	onlyUnAuth = false,
	children,
}: TProtectedRouteProps) => {
	const isInit = useSelector(selectUserIsInit);
	const isAuth = useSelector(selectUserIsAuth);
	const location = useLocation();

	if (!isInit) {
		return <Preloader />;
	}

	// Если пользователь авторизован, то отправляем его на страницу, которую он зашёл изначально
	// Или на главную, если его история пустая
	if (onlyUnAuth && isAuth) {
		const { from } = location.state || { from: { pathname: '/' } };

		return <Navigate to={from} replace />;
	}

	// Если пользователь НЕ авторизован, то отправляем его на страницу входа
	// Но если он залогинится, то возвращаем его обратно
	if (!onlyUnAuth && !isAuth) {
		return <Navigate to='/login' state={{ from: location }} replace />;
	}

	// Отправляем к контенту
	return children;
};
