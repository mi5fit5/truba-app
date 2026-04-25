import { configureStore } from '@reduxjs/toolkit';
import {
	type TypedUseSelectorHook,
	useDispatch as dispatchHook,
	useSelector as selectorHook,
} from 'react-redux';

import userReducer from '../slices/user';
import friendsReducer from '../slices/friends';
import chatReducer from '../slices/chat';

// Конфигурация стора
const store = configureStore({
	reducer: {
		user: userReducer,
		friends: friendsReducer,
		chat: chatReducer,
	},
});

// Типизация стейта и диспача
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Типазиция хуков
export const useDispatch: () => AppDispatch = () => dispatchHook();
export const useSelector: TypedUseSelectorHook<RootState> = selectorHook;

export default store;
