import axios from 'axios';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import type { TFriend, TFriendRequest } from '../../types';
import { friendsRequests } from '../../utils/api/friendsRequests';

// Типизация стейта
type TFriendsState = {
	friendList: TFriend[];
	incomingRequests: TFriendRequest[];
	isFriendsLoading: boolean;
	isRequestsLoading: boolean;
	isActionLoading: boolean;
	error: string | null;
};

// Начальное состояние
const initialState: TFriendsState = {
	friendList: [],
	incomingRequests: [],
	isFriendsLoading: false,
	isRequestsLoading: false,
	isActionLoading: false,
	error: null,
};

// Санка получения списка друзей
export const fetchFriends = createAsyncThunk(
	'friends/fetchFriends',
	async (_, { rejectWithValue }) => {
		try {
			const response = await friendsRequests.getFriends();

			return response.data;
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				return rejectWithValue(err.response?.data?.message);
			}

			if (err instanceof Error) {
				return rejectWithValue(err.message);
			}
		}
	}
);

// Санка получения списка входящих заявок в друзья
export const fetchFriendRequests = createAsyncThunk(
	'friends/fetchFriendRequests',
	async (_, { rejectWithValue }) => {
		try {
			const response = await friendsRequests.getIncomingRequests();

			return response.data;
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				return rejectWithValue(err.response?.data?.message);
			}

			if (err instanceof Error) {
				return rejectWithValue(err.message);
			}
		}
	}
);

// Санка отправки заявки в друзья
export const sendFriendRequest = createAsyncThunk(
	'friends/sendRequest',
	async (username: string, { rejectWithValue }) => {
		try {
			const response = await friendsRequests.sendRequest(username);

			return response.data;
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				return rejectWithValue(err.response?.data?.message);
			}

			if (err instanceof Error) {
				return rejectWithValue(err.message);
			}
		}
	}
);

// Санка принятия заявки в друзья
export const acceptRequest = createAsyncThunk(
	'friends/acceptRequest',
	async (requestId: string, { rejectWithValue, dispatch }) => {
		try {
			await friendsRequests.acceptRequest(requestId);

			// После принятия заявки в друзья -> обновляем списки друзей и заявок
			dispatch(fetchFriends());
			dispatch(fetchFriendRequests());

			return requestId;
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				return rejectWithValue(err.response?.data?.message);
			}

			if (err instanceof Error) {
				return rejectWithValue(err.message);
			}
		}
	}
);

// Санка отмены заявки в друзья
export const rejectRequest = createAsyncThunk(
	'friends/rejectRequest',
	async (requestId: string, { rejectWithValue, dispatch }) => {
		try {
			await friendsRequests.rejectRequest(requestId);

			dispatch(fetchFriendRequests()); // Обновляем список заявок

			return requestId;
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				return rejectWithValue(err.response?.data?.message);
			}

			if (err instanceof Error) {
				return rejectWithValue(err.message);
			}
		}
	}
);

// Слайс
const friendsSlice = createSlice({
	name: 'friends',
	initialState,
	reducers: {},
	selectors: {
		// Селекторы
		selectFriends: (state) => state.friendList,
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
				state.error = action.payload as string;
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
				state.error = action.payload as string;
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
				state.error = action.payload as string;
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
				state.error = action.payload as string;
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
				state.error = action.payload as string;
			})
			.addCase(rejectRequest.fulfilled, (state) => {
				state.isActionLoading = false;
			});
	},
});

export const {
	selectFriends,
	selectRequests,
	selectIsFriendsLoading,
	selectIsRequestsLoading,
	selectIsActionLoading,
	selectEror,
} = friendsSlice.selectors;

export default friendsSlice.reducer;
