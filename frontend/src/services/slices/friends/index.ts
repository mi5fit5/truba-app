import {
	createSlice,
	createAsyncThunk,
	type PayloadAction,
} from '@reduxjs/toolkit';

import type { TFriend, TFriendRequest } from '@types';
import { friendsRequests } from '@utils-api';
import { getErrorMessage } from '@utils/getErrorMessage';

// Типизация стейта
type TFriendsState = {
	friendList: TFriend[]; // Список друзей
	onlineUsers: string[]; // Пользователи, у которых статус "онлайн"
	incomingRequests: TFriendRequest[]; // Входящие запросы дружбы
	isFriendsLoading: boolean; // Флаг загрузки списка друзей
	isRequestsLoading: boolean; // Флаг загрузки списка входящих заявок в друзья
	isActionLoading: boolean; // Флаг исполнения активного действия
	error: string | null; // Ошибка
};

// Начальное состояние
const initialState: TFriendsState = {
	friendList: [],
	onlineUsers: [],
	incomingRequests: [],
	isFriendsLoading: false,
	isRequestsLoading: false,
	isActionLoading: false,
	error: null,
};

// Санка получения списка друзей
export const fetchFriends = createAsyncThunk<
	TFriend[],
	void,
	{ rejectValue: string }
>('friends/fetchFriends', async (_, { rejectWithValue }) => {
	try {
		const response = await friendsRequests.getFriends();

		return response.data;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err));
	}
});

// Санка получения списка входящих заявок в друзья
export const fetchFriendRequests = createAsyncThunk<
	TFriendRequest[],
	void,
	{ rejectValue: string }
>('friends/fetchFriendRequests', async (_, { rejectWithValue }) => {
	try {
		const response = await friendsRequests.getIncomingRequests();

		return response.data;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err));
	}
});

// Санка отправки заявки в друзья
export const sendFriendRequest = createAsyncThunk<
	void,
	string,
	{ rejectValue: string }
>('friends/sendRequest', async (username: string, { rejectWithValue }) => {
	try {
		const response = await friendsRequests.sendRequest(username);

		return response.data;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err));
	}
});

// Санка принятия заявки в друзья
export const acceptRequest = createAsyncThunk<
	string,
	string,
	{ rejectValue: string }
>(
	'friends/acceptRequest',
	async (requestId: string, { rejectWithValue, dispatch }) => {
		try {
			await friendsRequests.acceptRequest(requestId);

			// После принятия заявки в друзья -> обновляем списки друзей и заявок
			dispatch(fetchFriends());
			dispatch(fetchFriendRequests());

			return requestId;
		} catch (err: unknown) {
			return rejectWithValue(getErrorMessage(err));
		}
	}
);

// Санка отмены заявки в друзья
export const rejectRequest = createAsyncThunk<
	string,
	string,
	{ rejectValue: string }
>(
	'friends/rejectRequest',
	async (requestId: string, { rejectWithValue, dispatch }) => {
		try {
			await friendsRequests.rejectRequest(requestId);

			dispatch(fetchFriendRequests()); // Обновляем список заявок

			return requestId;
		} catch (err: unknown) {
			return rejectWithValue(getErrorMessage(err));
		}
	}
);

// Слайс
const friendsSlice = createSlice({
	name: 'friends',
	initialState,
	reducers: {
		setOnlineUsers: (state, action: PayloadAction<string[]>) => {
			state.onlineUsers = action.payload;
		},
	},
	selectors: {
		// Селекторы
		selectFriends: (state) => state.friendList,
		selectOnlineUsers: (state) => state.onlineUsers,
		selectRequests: (state) => state.incomingRequests,
		selectIsFriendsLoading: (state) => state.isFriendsLoading,
		selectIsRequestsLoading: (state) => state.isRequestsLoading,
		selectIsActionLoading: (state) => state.isActionLoading,
		selectEror: (state) => state.error,
	},
	extraReducers: (builder) => {
		builder
			// Загрузка списка друзей
			.addCase(fetchFriends.pending, (state) => {
				state.isFriendsLoading = true;
			})
			.addCase(fetchFriends.rejected, (state, action) => {
				state.isFriendsLoading = false;
				state.error = action.payload || 'Ошибка при получении списка друзей';
			})
			.addCase(fetchFriends.fulfilled, (state, action) => {
				state.isFriendsLoading = false;
				state.friendList = action.payload;
			})

			// Загрузка списка заявок
			.addCase(fetchFriendRequests.pending, (state) => {
				state.isRequestsLoading = true;
			})
			.addCase(fetchFriendRequests.rejected, (state, action) => {
				state.isRequestsLoading = false;
				state.error =
					action.payload ||
					'Ошибка при получении списка входящих запросов дружбы';
			})
			.addCase(fetchFriendRequests.fulfilled, (state, action) => {
				state.isRequestsLoading = false;
				state.incomingRequests = action.payload;
			})

			// Отправка запроса дружбы
			.addCase(sendFriendRequest.pending, (state) => {
				state.isActionLoading = true;
				state.error = null;
			})
			.addCase(sendFriendRequest.rejected, (state, action) => {
				state.isActionLoading = false;
				state.error = action.payload || 'Ошибка при отправке запроса дружбы';
			})
			.addCase(sendFriendRequest.fulfilled, (state) => {
				state.isActionLoading = false;
			})

			// Принятие заявки в друзья
			.addCase(acceptRequest.pending, (state) => {
				state.isActionLoading = true;
				state.error = null;
			})
			.addCase(acceptRequest.rejected, (state, action) => {
				state.isActionLoading = false;
				state.error = action.payload || 'Ошибка при принятии запроса дружбы';
			})
			.addCase(acceptRequest.fulfilled, (state) => {
				state.isActionLoading = false;
			})

			// Отклонение заявки в друзья
			.addCase(rejectRequest.pending, (state) => {
				state.isActionLoading = true;
				state.error = null;
			})
			.addCase(rejectRequest.rejected, (state, action) => {
				state.isActionLoading = false;
				state.error = action.payload || 'Ошибка при отказе запроса дружбы';
			})
			.addCase(rejectRequest.fulfilled, (state) => {
				state.isActionLoading = false;
			});
	},
});

export const { setOnlineUsers } = friendsSlice.actions;
export const {
	selectFriends,
	selectOnlineUsers,
	selectRequests,
	selectIsFriendsLoading,
	selectIsRequestsLoading,
	selectIsActionLoading,
	selectEror,
} = friendsSlice.selectors;

export default friendsSlice.reducer;
