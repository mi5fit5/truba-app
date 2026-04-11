import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { authRequests } from '../../../utils/authRequests';
import type { TLoginData, TRegisterData, TUser } from '../../../types';
import { deleteCookie, setCookie } from '../../../utils/cookie';

// Типизация стейта
type TUserState = {
	data: TUser | null;
	isInit: boolean; // Проверка инициализации
	isAuth: boolean; // Проверка авторизации
	loginError: string | null;
	registerError: string | null;
};

// Начальное состояние
const initialState: TUserState = {
	isInit: false,
	isAuth: false,
	loginError: null,
	registerError: null,
	data: null,
};

// Санка регистрации
export const registerUser = createAsyncThunk<TUser, TRegisterData>(
	'auth/register',
	async (data, { rejectWithValue }) => {
		const responce = await authRequests.register(data);

		// Обработка ошибок при неуспешном запросе
		if (!responce.user) {
			return rejectWithValue(responce.message);
		}

		const { user, refreshToken, accessToken } = responce;

		// Сохраняем токены
		localStorage.setItem('refreshToken', refreshToken);
		setCookie('accessToken', accessToken);

		return user;
	}
);

// Санка входа
export const loginUser = createAsyncThunk<TUser, TLoginData>(
	'auth/login',
	async (data, { rejectWithValue }) => {
		const responce = await authRequests.login(data);

		// Обработка ошибок при неуспешном запросе
		if (!responce.user) {
			return rejectWithValue(responce.message);
		}

		const { user, refreshToken, accessToken } = responce;

		localStorage.setItem('refreshToken', refreshToken);
		setCookie('accessToken', accessToken);

		return user;
	}
);

// Санка выхода
export const logoutUser = createAsyncThunk(
	'auth/logout',
	async (_, { rejectWithValue }) => {
		const responce = await authRequests.logout();

		// Обработка ошибок при неуспешном запросе
		if (responce.error) {
			return rejectWithValue(responce.message);
		}

		// Очищаем токены
		localStorage.removeItem('refreshToken');
		deleteCookie('accessToken');
	}
);

// Санка получения данных текущего пользователя
export const fetchCurrentUser = createAsyncThunk(
	'user/fetch',
	async (_, { rejectWithValue }) => {
		const responce = await authRequests.getUser();

		// Обработка ошибок при неуспешном запросе
		if (!responce.user) {
			return rejectWithValue('Такой пользователь не найден');
		}

		return responce.user;
	}
);

// Слайс
const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {},
	selectors: {
		// Селекторы
		selectUserData: (state) => state.data,
		selectUserIsInit: (state) => state.isInit,
		selectUserIsAuth: (state) => state.isAuth,
		selectUserRegisterError: (state) => state.registerError,
		selectUserLoginError: (state) => state.loginError,
	},
	extraReducers: (builder) => {
		builder
			// Логин
			.addCase(loginUser.pending, (state) => {
				state.loginError = null;
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.loginError = action.payload as string;
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.isAuth = true;
				state.loginError = null;
				state.data = action.payload;
			})

			// Регистрация
			.addCase(registerUser.pending, (state) => {
				state.registerError = null;
			})
			.addCase(registerUser.rejected, (state, action) => {
				state.registerError = action.payload as string;
			})
			.addCase(registerUser.fulfilled, (state, action) => {
				state.isAuth = true;
				state.registerError = null;
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

export const {
	selectUserData,
	selectUserIsInit,
	selectUserIsAuth,
	selectUserRegisterError,
	selectUserLoginError,
} = userSlice.selectors;

export default userSlice.reducer;
