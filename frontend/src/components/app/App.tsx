import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import { useDispatch } from '@store';
import { fetchCurrentUser } from '@slices';

import { Login, Register, HomePage, NotFound } from '@pages';
import { ProtectedRoute } from '@navigation';

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
			<Route path='/' element={<HomePage />} />
			<Route path='*' element={<NotFound />} />
		</Routes>
	);
};
