import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import { useDispatch } from '@store';
import { fetchCurrentUser } from '@slices';
import { SocketContext } from '@context';
import { useSocket } from '@hooks';

import { Login, Register, HomePage } from '@pages';
import { PeerProvider, ProtectedRoute } from '@components';

export const App = () => {
	const dispatch = useDispatch();
	const socket = useSocket();

	useEffect(() => {
		dispatch(fetchCurrentUser());
	}, [dispatch]);

	return (
		<SocketContext.Provider value={socket}>
			<PeerProvider>
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
					<Route path='*' />
				</Routes>
			</PeerProvider>
		</SocketContext.Provider>
	);
};
