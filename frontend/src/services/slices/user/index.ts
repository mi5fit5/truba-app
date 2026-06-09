import {
	createSlice,
	createAsyncThunk,
	type PayloadAction,
} from '@reduxjs/toolkit';

import type {
	TChangePasswordData,
	TLoginData,
	TRegisterData,
	TUpdateProfileData,
	TUser,
} from '@types';
import { authRequests } from '@utils-api';
import { deleteCookie, setCookie } from '@utils/cookie';
import { getErrorMessage } from '@utils/getErrorMessage';

// Типизация стейта
export type TUserState = {
	data: TUser | null;
	isInit: boolean; // Проверка инициализации
	isAuth: boolean; // Проверка авторизации
	authError: string | null;
};

// Начальное состояние
const initialState: TUserState = {
	data: null,
	isInit: false,
	isAuth: false,
	authError: null,
};

// Санка регистрации
export const registerUser = createAsyncThunk<
	TUser,
	TRegisterData,
	{ rejectValue: string }
>('auth/register', async (data, { rejectWithValue }) => {
	try {
		const { user } = await authRequests.register(data);
		return user;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err));
	}
});

// Санка входа
export const loginUser = createAsyncThunk<
	TUser,
	TLoginData,
	{ rejectValue: string }
>('auth/login', async (data, { rejectWithValue }) => {
	try {
		const { user } = await authRequests.login(data);
		return user;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err));
	}
});

// Санка выхода
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
	'auth/logout',
	async (_, { rejectWithValue }) => {
		try {
			await authRequests.logout();
		} catch (err: unknown) {
			return rejectWithValue(getErrorMessage(err));
		}
	}
);

// Санка получения данных текущего пользователя
export const fetchCurrentUser = createAsyncThunk<
	TUser,
	void,
	{ rejectValue: string }
>('user/fetch', async (_, { rejectWithValue }) => {
	try {
		const response = await authRequests.getUser();

		return response.user;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err));
	}
});

// Санка обновления профиля (аватар, био)
export const updateUserProfile = createAsyncThunk<
	TUser,
	TUpdateProfileData,
	{ rejectValue: string }
>('user/updateProfile', async (data, { rejectWithValue }) => {
	try {
		const response = await authRequests.updateProfile(data);

		return response.user;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err));
	}
});

// Санка смены пароля
export const changeUserPassword = createAsyncThunk<
	string,
	TChangePasswordData,
	{ rejectValue: string }
>('user/changePassword', async (data, { rejectWithValue }) => {
	try {
		const response = await authRequests.changePassword(data);
		return response.message;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err));
	}
});

// Слайс
const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		clearAuthError: (state) => {
			state.authError = null;
		},

		// Обновление статуса игры у текущего пользователя
		setCurrentUserGameStatus: (
			state,
			action: PayloadAction<{
				currentGame: string | null;
				appId: string | null;
				lobbyId: string | null;
				gameAvatarUrl: string | null;
			}>
		) => {
			if (state.data) {
				state.data.currentGame = action.payload.currentGame;
				state.data.appId = action.payload.appId;
				state.data.lobbyId = action.payload.lobbyId;
				state.data.gameAvatarUrl = action.payload.gameAvatarUrl;
			}
		},
	},
	selectors: {
		// Селекторы
		selectUserData: (state) => state.data,
		selectUserIsInit: (state) => state.isInit,
		selectUserIsAuth: (state) => state.isAuth,
		selectAuthError: (state) => state.authError,
	},
	extraReducers: (builder) => {
		builder
			// Логин
			.addCase(loginUser.pending, (state) => {
				state.authError = null;
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.authError = action.payload || 'Ошибка при входе';
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.isAuth = true;
				state.authError = null;
				state.data = action.payload;
			})

			// Регистрация
			.addCase(registerUser.pending, (state) => {
				state.authError = null;
			})
			.addCase(registerUser.rejected, (state, action) => {
				state.authError = action.payload || 'Ошибка при регистрации';
			})
			.addCase(registerUser.fulfilled, (state, action) => {
				state.isAuth = true;
				state.authError = null;
				state.data = action.payload;
			})

			// Выход (удаляем данные пользователя из стейта)
			.addCase(logoutUser.fulfilled, (state) => {
				state.data = null;
				state.isAuth = false;
			})

			// Получение данных текущего пользователя
			.addCase(fetchCurrentUser.rejected, (state) => {
				state.isInit = true;
				state.isAuth = false;
			})
			.addCase(fetchCurrentUser.fulfilled, (state, action) => {
				state.isInit = true;
				state.isAuth = true;
				state.data = action.payload;
			})

			// Обновление профиля
			.addCase(updateUserProfile.fulfilled, (state, action) => {
				state.data = action.payload;
			});
	},
});

export const { clearAuthError, setCurrentUserGameStatus } = userSlice.actions;

export const {
	selectUserData,
	selectUserIsInit,
	selectUserIsAuth,
	selectAuthError,
} = userSlice.selectors;

export default userSlice.reducer;
