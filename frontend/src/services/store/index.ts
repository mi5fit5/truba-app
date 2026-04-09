import { configureStore } from '@reduxjs/toolkit';
import {
	type TypedUseSelectorHook,
	useDispatch as dispatchHook,
	useSelector as selectorHook,
} from 'react-redux';

import userReducer from '../slices/user/userSlice';

// Конфигурация стора
const store = configureStore({
	reducer: {
		user: userReducer,
	},
});

// Типизация стейта и диспача
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Типазиция хуков
export const useDispatch: () => AppDispatch = () => dispatchHook();
export const useSelector: TypedUseSelectorHook<RootState> = selectorHook;

export default store;
