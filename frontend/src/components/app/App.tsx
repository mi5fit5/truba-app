import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import { useDispatch } from '@store';
import { fetchCurrentUser } from '@slices';
import { useSocket } from '@hooks/useSocket';

import { ProtectedRoute } from '@components';
import { Login, Register, HomePage } from '@pages';

export const App = () => {
	const dispatch = useDispatch();

	useSocket();

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
