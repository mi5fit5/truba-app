import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import { useDispatch } from '@store';
import { fetchCurrentUser } from '@slices';
import { SocketContext, useSocket } from '@hooks';

import { ProtectedRoute } from '@components';
import { Login, Register, HomePage } from '@pages';

export const App = () => {
	const dispatch = useDispatch();
	const socket = useSocket();

	useEffect(() => {
		dispatch(fetchCurrentUser());
	}, [dispatch]);

	return (
		<SocketContext.Provider value={socket}>
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
		</SocketContext.Provider>
	);
};
