import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import type { TLoginData, TRegisterData, TUser } from '@types';
import { authRequests } from '@utils-api';
import { deleteCookie, setCookie } from '@utils/cookie';
import { getErrorMessage } from '@utils/getErrorMessage';

// Типизация стейта
type TUserState = {
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
		const response = await authRequests.register(data);
		const { user, refreshToken, accessToken } = response;

		// Сохраняем токены
		localStorage.setItem('refreshToken', refreshToken);
		setCookie('accessToken', accessToken);

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
		const response = await authRequests.login(data);
		const { user, refreshToken, accessToken } = response;

		localStorage.setItem('refreshToken', refreshToken);
		setCookie('accessToken', accessToken);

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

			// Очищаем токены
			localStorage.removeItem('refreshToken');
			deleteCookie('accessToken');
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

// Слайс
const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		clearAuthError: (state) => {
			state.authError = null;
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
			});
	},
});

export const { clearAuthError } = userSlice.actions;

export const {
	selectUserData,
	selectUserIsInit,
	selectUserIsAuth,
	selectAuthError,
} = userSlice.selectors;

export default userSlice.reducer;
