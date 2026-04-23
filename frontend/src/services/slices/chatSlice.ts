import {
	createSlice,
	createAsyncThunk,
	type PayloadAction,
} from '@reduxjs/toolkit';

import type { TMessage } from '../../types';
import { chatRequests } from '../../utils/api/chatRequests';
import { getErrorMessage } from '../../utils/getErrorMessage';

// Типизация стейта
type TChatState = {
	activeFriendId: string | null;
	messages: TMessage[];
	isLoadingHistory: boolean;
	isSending: boolean;
	isSearchActive: boolean;
	error: string | null;
};

// Начальное состояние
const initialState: TChatState = {
	activeFriendId: null,
	messages: [],
	isLoadingHistory: false,
	isSending: false,
	isSearchActive: false,
	error: null,
};

// Санка получения истории переписки
export const fetchChatHistory = createAsyncThunk<
	TMessage[],
	string,
	{ rejectValue: string }
>('chat/fetchChatHistory', async (friendId, { rejectWithValue }) => {
	try {
		const response = await chatRequests.getChatHistory(friendId);

		return response.data;
	} catch (err: unknown) {
		rejectWithValue(getErrorMessage(err));
	}
});

// Санка отправки нового сообщения
export const sendMessage = createAsyncThunk<
	TMessage,
	{ friendId: string; text: string },
	{ rejectValue: string }
>('chat/sendMessage', async ({ friendId, text }, { rejectWithValue }) => {
	try {
		const response = await chatRequests.sendMessage(friendId, text);

		return response.data;
	} catch (err: unknown) {
		rejectWithValue(getErrorMessage(err));
	}
});

export const fetchSearchedMessages = createAsyncThunk<
	TMessage[],
	{ friendId: string; text: string },
	{ rejectValue: string }
>('chat/searchMessages', async ({ friendId, text }, { rejectWithValue }) => {
	try {
		const response = await chatRequests.searchMessages(friendId, text);

		return response.data;
	} catch (err: unknown) {
		rejectWithValue(getErrorMessage(err));
	}
});

// Слайс
const chatSlice = createSlice({
	name: 'chat',
	initialState,
	reducers: {
		setActiveFriendId: (state, action: PayloadAction<string | null>) => {
			state.activeFriendId = action.payload;
		},
	},
	selectors: {
		// Селекторы
		selectActiveFriendId: (state) => state.activeFriendId,
		selectChatMessages: (state) => state.messages,
		selectIsLoadingHistory: (state) => state.isLoadingHistory,
		selectIsSending: (state) => state.isSending,
		selectIsSearchActive: (state) => state.isSearchActive,
		selectChatError: (state) => state.error,
	},
	extraReducers: (builder) => {
		builder
			// Загрузка истории чата
			.addCase(fetchChatHistory.pending, (state) => {
				state.isLoadingHistory = true;
				state.error = null;
			})
			.addCase(fetchChatHistory.rejected, (state, action) => {
				state.isLoadingHistory = false;
				state.error =
					action.payload || 'Ошибка при получении истории сообщений в чате';
			})
			.addCase(fetchChatHistory.fulfilled, (state, action) => {
				state.isLoadingHistory = false;
				state.isSearchActive = false;
				state.messages = action.payload;
			})

			// Отправка нового сообщения
			.addCase(sendMessage.pending, (state) => {
				state.isSending = true;
				state.error = null;
			})
			.addCase(sendMessage.rejected, (state, action) => {
				state.isSending = false;
				state.error = action.payload || 'Ошибка при отправке нового сообщения';
			})
			.addCase(sendMessage.fulfilled, (state, action) => {
				state.isSending = false;
				state.messages.push(action.payload);
			})

			// Поиск сообщений
			.addCase(fetchSearchedMessages.pending, (state) => {
				state.isLoadingHistory = true;
				state.error = null;
			})
			.addCase(fetchSearchedMessages.rejected, (state, action) => {
				state.isLoadingHistory = false;
				state.error = action.payload || 'Ошибка при поиске сообщений';
			})
			.addCase(fetchSearchedMessages.fulfilled, (state, action) => {
				state.isLoadingHistory = false;
				state.isSearchActive = true;
				state.messages = action.payload;
			});
	},
});

export const { setActiveFriendId } = chatSlice.actions;
export const {
	selectActiveFriendId,
	selectChatMessages,
	selectIsLoadingHistory,
	selectIsSending,
	selectIsSearchActive,
	selectChatError,
} = chatSlice.selectors;

export default chatSlice.reducer;
