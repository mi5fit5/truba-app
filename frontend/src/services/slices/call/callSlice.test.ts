import callReducer, {
	initiateCall,
	receiveCall,
	updatePeerMedia,
	endCall,
} from '.';
import type { TParticipant, TCallType } from '@types';

describe('callSlice business logic', () => {
	// Ссостояние для сброса перед каждым тестом
	const initialState = {
		status: 'idle' as const,
		callType: null,
		participant: null,
		incomingSignal: null,
		remoteMedia: { isMicMuted: false, isCamMuted: false },
		isChatOpen: false,
		isScreenSharing: false,
	};

	const mockParticipant: TParticipant = {
		_id: 'user_123',
		username: 'TestUser',
		avatar: 'avatar.jpg',
	};

	// Тест 1: Проверка инициации звонка
	test('should handle initiateCall and set calling status', () => {
		const action = initiateCall({
			participant: mockParticipant,
			type: 'video',
		});
		const state = callReducer(initialState, action);

		expect(state.status).toBe('calling');
		expect(state.participant).toEqual(mockParticipant);
		expect(state.callType).toBe('video');
		expect(state.remoteMedia.isCamMuted).toBe(false);
	});

	// Тест 2: Проверка получения входяшего звонка
	test('should handle receiveCall with remote media states', () => {
		const mockIncomingCall = {
			from: mockParticipant,
			signal: { type: 'offer' as const, sdp: 'fake_sdp' },
			callType: 'audio' as TCallType,
			mediaState: { micMuted: true, camMuted: true },
		};

		const action = receiveCall(mockIncomingCall);
		const state = callReducer(initialState, action);

		expect(state.status).toBe('receiving');
		expect(state.incomingSignal).toBeDefined();

		// Проверка, что состояние устройств собеседника подтянулось из сокета
		expect(state.remoteMedia.isMicMuted).toBe(true);
		expect(state.remoteMedia.isCamMuted).toBe(true);
	});

	// Тест 3: Проверка обновления статуса видео собеседника
	test('should handle updatePeerMedia to mute remote video', () => {
		const activeState = { ...initialState, status: 'connected' as const };

		// Эмуляция выключения камеры собеседником
		const action = updatePeerMedia({ type: 'video', isMuted: true });
		const state = callReducer(activeState, action);

		expect(state.remoteMedia.isCamMuted).toBe(true);
	});

	// Тест 4: Проверка сброса состояниия при завершении звонка
	test('should completely reset state on endCall', () => {
		const messyState = {
			status: 'connected' as const,
			callType: 'video' as TCallType,
			participant: mockParticipant,
			incomingSignal: null,
			remoteMedia: { isMicMuted: true, isCamMuted: false },
			isChatOpen: true,
			isScreenSharing: true,
		};

		const state = callReducer(messyState, endCall());

		expect(state).toEqual(initialState);
	});
});
