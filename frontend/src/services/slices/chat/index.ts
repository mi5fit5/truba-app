import {
	createSlice,
	createAsyncThunk,
	type PayloadAction,
} from '@reduxjs/toolkit';

import type { TMessage } from '@types';
import { chatRequests } from '@utils-api';
import { getErrorMessage } from '@utils/getErrorMessage';

// Типизация стейта
type TChatState = {
	activeFriendId: string | null; // id активного пользователя (для чата)
	messages: TMessage[]; // Сообщения
	unreadSenders: string[]; // Непрочитанные пользователя
	isLoadingHistory: boolean; // Флаг загрузки окна чата
	isSending: boolean; // Флаг отправки сообщения
	isSearchActive: boolean; // Флаг поиска сообщений
	error: string | null; // Ошибка
};

// Начальное состояние
const initialState: TChatState = {
	activeFriendId: null,
	messages: [],
	unreadSenders: [],
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
		setActiveFriendId: (state, action: PayloadAction<string>) => {
			state.activeFriendId = action.payload;
			state.unreadSenders = state.unreadSenders.filter(
				(id) => id !== action.payload
			);
		},
		addMessage: (state, action: PayloadAction<TMessage>) => {
			const newMessage = action.payload;
			const isChatActive =
				state.activeFriendId === newMessage.sender ||
				state.activeFriendId === newMessage.recipient;

			if (isChatActive) {
				state.messages.push(newMessage);
			} else {
				if (!state.unreadSenders.includes(newMessage.sender)) {
					state.unreadSenders.push(newMessage.sender);
				}
			}
		},
	},
	selectors: {
		// Селекторы
		selectActiveFriendId: (state) => state.activeFriendId,
		selectChatMessages: (state) => state.messages,
		selectUnreadSenders: (state) => state.unreadSenders,
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

export const { setActiveFriendId, addMessage } = chatSlice.actions;
export const {
	selectActiveFriendId,
	selectChatMessages,
	selectUnreadSenders,
	selectIsLoadingHistory,
	selectIsSending,
	selectIsSearchActive,
	selectChatError,
} = chatSlice.selectors;

export default chatSlice.reducer;
