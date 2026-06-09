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
	remoteMedia: {
		// Данные удаленного медиапотока
		isMicMuted: boolean;
		isCamMuted: boolean;
	};
	isChatOpen: boolean; // Открыт ли чат
	isScreenSharing: boolean; // Идёт ли демонстрация экрана
};

const initialRemoteMedia = {
	isMicMuted: false,
	isCamMuted: false,
};

// Начальное состояние
const initialState: TCallState = {
	status: 'idle',
	callType: null,
	participant: null,
	incomingSignal: null,
	remoteMedia: initialRemoteMedia,
	isChatOpen: false,
	isScreenSharing: false,
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
			state.remoteMedia.isMicMuted = false;
			state.remoteMedia.isCamMuted = action.payload.type === 'audio';
		},

		// Получить звонок от друга
		receiveCall: (state, action: PayloadAction<TIncomingCall>) => {
			state.status = 'receiving';
			state.participant = action.payload.from;
			state.incomingSignal = action.payload.signal;
			state.callType = action.payload.callType;
			state.remoteMedia.isMicMuted = action.payload.mediaState.micMuted;
			state.remoteMedia.isCamMuted = action.payload.mediaState.camMuted;
		},

		// Обновление состояние собеседника
		updatePeerMedia: (
			state,
			action: PayloadAction<{ type: 'audio' | 'video'; isMuted: boolean }>
		) => {
			if (action.payload.type === 'audio') {
				state.remoteMedia.isMicMuted = action.payload.isMuted;
			}

			if (action.payload.type === 'video') {
				state.remoteMedia.isCamMuted = action.payload.isMuted;
			}
		},

		// Принять входящий звонок
		acceptCall: (
			state,
			action: PayloadAction<
				{ mediaState?: { micMuted: boolean; camMuted: boolean } } | undefined
			>
		) => {
			state.status = 'connected';
			state.incomingSignal = null;

			if (action.payload?.mediaState) {
				state.remoteMedia.isMicMuted = action.payload.mediaState.micMuted;
				state.remoteMedia.isCamMuted = action.payload.mediaState.camMuted;
			}
		},

		// Открытие чата
		setChatOpen: (state, action: PayloadAction<boolean>) => {
			state.isChatOpen = action.payload;
		},

		// Демонстрация экрана
		setScreenSharing: (state, action: PayloadAction<boolean>) => {
			state.isScreenSharing = action.payload;
		},

		// Сброс про завершении звонка
		endCall: (state) => {
			state.status = 'idle';
			state.callType = null;
			state.participant = null;
			state.incomingSignal = null;
			state.remoteMedia.isMicMuted = false;
			state.remoteMedia.isCamMuted = false;
			state.isChatOpen = false;
			state.isScreenSharing = false;
		},
	},
	selectors: {
		// Селекторы
		selectCallStatus: (state) => state.status,
		selectCallType: (state) => state.callType,
		selectParticipant: (state) => state.participant,
		selectIncomingSignal: (state) => state.incomingSignal,
		selectRemoteMedia: (state) => state.remoteMedia,
		selectIsChatOpen: (state) => state.isChatOpen,
		selectIsScreenSharing: (state) => state.isScreenSharing,
	},
});

export const {
	initiateCall,
	receiveCall,
	updatePeerMedia,
	acceptCall,
	setChatOpen,
	setScreenSharing,
	endCall,
} = callSlice.actions;

export const {
	selectCallStatus,
	selectCallType,
	selectParticipant,
	selectIncomingSignal,
	selectRemoteMedia,
	selectIsChatOpen,
	selectIsScreenSharing,
} = callSlice.selectors;

export default callSlice.reducer;
