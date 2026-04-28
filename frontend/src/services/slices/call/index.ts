import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SignalData } from 'simple-peer';
import type {
	TParticipant,
	TCallStatus,
	TIncomingCall,
	TCallType,
} from '@types';

// Типизация стейта
type TCallState = {
	status: TCallStatus; // Текущий статус звонка
	callType: TCallType | null; // Тип звонка (аудио или видео)
	participant: TParticipant | null; // Данные собеседника
	incomingSignal: SignalData | null; // Данные для установки соединения
};

// Начальное состояние
const initialState: TCallState = {
	status: 'idle',
	callType: null,
	participant: null,
	incomingSignal: null,
};

// Слайс
const callSlice = createSlice({
	name: 'call',
	initialState,
	reducers: {
		// Инициировать звонок
		initiateCall: (
			state,
			action: PayloadAction<{ participant: TParticipant; type: TCallType }>
		) => {
			state.status = 'calling';
			state.participant = action.payload.participant;
			state.callType = action.payload.type;
		},
		// Получить звонок от друга
		receiveCall: (state, action: PayloadAction<TIncomingCall>) => {
			state.status = 'receiving';
			state.participant = action.payload.from;
			state.incomingSignal = action.payload.signal;
			state.callType = action.payload.callType;
		},
		// Принять входящий звонок
		acceptCall: (state) => {
			state.status = 'connected';
			state.incomingSignal = null;
		},
		// Завершить или оклонить звонок
		endCall: (state) => {
			state.status = 'idle';
			state.callType = null;
			state.participant = null;
			state.incomingSignal = null;
		},
	},
	selectors: {
		// Селекторы
		selectCallStatus: (state) => state.status,
		selectCallType: (state) => state.callType,
		selectParticipant: (state) => state.participant,
		selectIncomingSignal: (state) => state.incomingSignal,
	},
});

export const { initiateCall, receiveCall, acceptCall, endCall } =
	callSlice.actions;

export const {
	selectCallStatus,
	selectCallType,
	selectParticipant,
	selectIncomingSignal,
} = callSlice.selectors;

export default callSlice.reducer;
