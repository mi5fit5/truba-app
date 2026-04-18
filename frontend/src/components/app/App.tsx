import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import { useDispatch } from '../../services/store';

import { ProtectedRoute } from '../ProtectedRoute';
import { Login } from '../../pages/Login';
import { Register } from '../../pages/Register';
import { HomePage } from '../../pages/HomePage';

import { fetchCurrentUser } from '../../services/slices/userSlice';

export const App = () => {
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(fetchCurrentUser());
	}, [dispatch]);

	return (
		<Routes>
			<Route
				path='/login'
				element={
					<ProtectedRoute onlyUnAuth>
						<Login />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/register'
				element={
					<ProtectedRoute onlyUnAuth>
						<Register />
					</ProtectedRoute>
				}
			/>
			<Route
				path='/'
				element={
					<ProtectedRoute>
						<HomePage />
					</ProtectedRoute>
				}
			/>
		</Routes>
	);
};
