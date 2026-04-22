import axios from 'axios';
import {
	createSlice,
	createAsyncThunk,
	type PayloadAction,
} from '@reduxjs/toolkit';

import type { TMessage } from '../../types';
import { chatRequests } from '../../utils/api/chatRequests';

// Типизация стейта
type TChatState = {
	activeFriendId: string | null;
	messages: TMessage[];
	isLoadingHistory: boolean;
	isSending: boolean;
	error: string | null;
};

// Начальное состояние
const initialState: TChatState = {
	activeFriendId: null,
	messages: [],
	isLoadingHistory: false,
	isSending: false,
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
		if (axios.isAxiosError(err)) {
			return rejectWithValue(err.response?.data?.message);
		}

		if (err instanceof Error) {
			return rejectWithValue(err.message);
		}
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
		if (axios.isAxiosError(err)) {
			return rejectWithValue(err.response?.data?.message);
		}

		if (err instanceof Error) {
			return rejectWithValue(err.message);
		}
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
			});
	},
});

export const { setActiveFriendId } = chatSlice.actions;
export const { selectActiveFriendId, selectChatMessages, selectChatError } =
	chatSlice.selectors;

export default chatSlice.reducer;
