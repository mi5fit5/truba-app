import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { type Instance, type SignalData } from 'simple-peer';

import type { TCallType, TNoiseMode, TSelectOption } from '@types';
import { useDispatch, useSelector } from '@store';
import {
	acceptCall,
	endCall,
	selectCallType,
	selectIncomingSignal,
	selectIsScreenSharing,
	selectParticipant,
	setScreenSharing,
} from '@slices';
import { useSocketInstance } from '@context';
import { useAudioProcessor } from '@hooks';

import { truncateOptionsText } from '@utils/textUtils';

// Хук для управления WebRTC-соединением
export const usePeerConnection = () => {
	const dispatch = useDispatch();
	const socket = useSocketInstance();

	const incomingSignal = useSelector(selectIncomingSignal);
	const participant = useSelector(selectParticipant);
	const callType = useSelector(selectCallType);
	const isScreenSharing = useSelector(selectIsScreenSharing);

	// Инициализация нейросети + реф для хранения сырого звука
	const { startNoiseSuppression, stopNoiseSuppression } = useAudioProcessor();
	const rawAudioTrackRef = useRef<MediaStreamTrack | null>(null);

	// Стейты для потоков
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
	const [remoteStreamRevision, setRemoteStreamRevision] = useState(0);

	// Стейты для списков доступных устройств
	const [availableMics, setAvailableMics] = useState<TSelectOption[]>([]);
	const [availableCams, setAvailableCams] = useState<TSelectOption[]>([]);
	const [availableSpeakers, setAvailableSpeakers] = useState<TSelectOption[]>(
		[]
	);

	// Инициализация из Local Storage
	const [selectedMic, setSelectedMic] = useState<string>(
		() => localStorage.getItem('voice_chat_selected_mic') || ''
	);
	const [selectedCam, setSelectedCam] = useState<string>(
		() => localStorage.getItem('voice_chat_selected_cam') || ''
	);
	const [selectedSpeaker, setSelectedSpeaker] = useState<string>(
		() => localStorage.getItem('voice_chat_selected_speaker') || ''
	);
	const [noiseMode, setNoiseMode] = useState<TNoiseMode>(
		() =>
			(localStorage.getItem('voice_chat_noise_mode') as TNoiseMode) ||
			'standard'
	);

	// Рефы для работы с DOM-элементами; хранения соединения и потока;
	// активности звонка; демонстрации экрана
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const remoteAudioRef = useRef<HTMLAudioElement>(null);
	const peerRef = useRef<Instance | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const isCallActiveRef = useRef<boolean>(false);
	const screenStreamRef = useRef<MediaStream | null>(null);
	const isConnectingRef = useRef<boolean>(false);

	// Получение списка доступных устройств при старте звонка
	useEffect(() => {
		navigator.mediaDevices
			.enumerateDevices()
			.then((devices) => {
				const audioDevices = devices
					.filter((device) => device.kind === 'audioinput')
					.map((mic) => ({
						value: mic.deviceId,
						label: truncateOptionsText(mic.label || 'Неизвестный микрофон'),
					}));

				const videoDevices = devices
					.filter((device) => device.kind === 'videoinput')
					.map((cam) => ({
						value: cam.deviceId,
						label: truncateOptionsText(cam.label || 'Неизвестная камера'),
					}));

				const outputDevices = devices
					.filter((device) => device.kind === 'audiooutput')
					.map((speaker) => ({
						value: speaker.deviceId,
						label: truncateOptionsText(speaker.label || 'Неизвестные динамики'),
					}));

				setAvailableMics(audioDevices);
				setAvailableCams(videoDevices);
				setAvailableSpeakers(outputDevices);
			})
			.catch((err) =>
				console.error('Ошибка получения списка доступных устройств:', err)
			);
	}, []);

	// Захват видео и аудио
	const startMedia = async (type: TCallType) => {
		try {
			isCallActiveRef.current = true;

			// Очищаем старые потоки
			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach((track) => track.stop());
			}

			// Ограничения
			const audioConstraints = selectedMic
				? {
						deviceId: { ideal: selectedMic },
						echoCancellation: true,
						noiseSuppression: true,
					}
				: true;
			const videoConstraints =
				type === 'video'
					? selectedCam
						? { deviceId: { ideal: selectedCam } }
						: true
					: false;

			// Поток
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: audioConstraints,
				video: videoConstraints,
			});

			if (!isCallActiveRef.current) {
				stream.getTracks().forEach((track) => track.stop());
				return null;
			}

			setLocalStream(stream);
			localStreamRef.current = stream;
			rawAudioTrackRef.current = stream.getAudioTracks()[0];

			if (noiseMode === 'rnnoise') await applyNoiseMode('rnnoise');

			return stream;
		} catch (err: unknown) {
			console.error('Ошибка медиа:', err);
			return null;
		}
	};

	// Управление видео
	const toggleLocalVideo = async (): Promise<boolean> => {
		if (!localStreamRef.current || !peerRef.current) return false;

		const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];

		// Если была включена камера -> полностью её выключаем
		if (currentVideoTrack) {
			currentVideoTrack.stop();
			localStreamRef.current.removeTrack(currentVideoTrack);
			peerRef.current.removeTrack(currentVideoTrack, localStreamRef.current);

			setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

			return false;
		} else {
			// А если была выключена, то добавляем новый трек
			try {
				const camStream = await navigator.mediaDevices.getUserMedia({
					video: selectedCam ? { deviceId: { ideal: selectedCam } } : true,
				});
				const newTrack = camStream.getVideoTracks()[0];

				localStreamRef.current.addTrack(newTrack);
				peerRef.current.addTrack(newTrack, localStreamRef.current);

				setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

				return true;
			} catch (err: unknown) {
				console.error('Отсутсвует доступ к камере:', err);
				return false;
			}
		}
	};

	// Управление аудио
	const toggleLocalAudio = (): boolean => {
		if (!localStreamRef.current) return false;

		const audioTrack = localStreamRef.current.getAudioTracks()[0];

		if (audioTrack) {
			audioTrack.enabled = !audioTrack.enabled;

			return audioTrack.enabled;
		}
		return false;
	};

	// Переключение устройства (микрофон, камера) / шумодава
	const switchDevice = async (type: 'audio' | 'video', deviceId: string) => {
		if (type === 'audio') {
			setSelectedMic(deviceId);
			localStorage.setItem('voice_chat_selected_mic', deviceId);
		} else {
			setSelectedCam(deviceId);
			localStorage.setItem('voice_chat_selected_cam', deviceId);
		}

		if (!localStreamRef.current || !peerRef.current) return;

		try {
			const constraints =
				type === 'audio'
					? { audio: { deviceId: { exact: deviceId } } }
					: { video: { deviceId: { exact: deviceId } } };

			const newStream = await navigator.mediaDevices.getUserMedia(constraints);
			const newTrack =
				type === 'audio'
					? newStream.getAudioTracks()[0]
					: newStream.getVideoTracks()[0];

			const oldTrack =
				type === 'audio'
					? localStreamRef.current.getAudioTracks()[0]
					: localStreamRef.current.getVideoTracks()[0];

			if (oldTrack && newTrack) {
				peerRef.current.replaceTrack(
					oldTrack,
					newTrack,
					localStreamRef.current
				);
				localStreamRef.current.removeTrack(oldTrack);
				oldTrack.stop();
				localStreamRef.current.addTrack(newTrack);

				setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

				if (type === 'audio') {
					rawAudioTrackRef.current = newTrack;
					await applyNoiseMode(noiseMode);
				}
			}
		} catch (err: unknown) {
			console.error(`Ошибка переключения ${type}:`, err);
		}
	};

	// Переключение устройства вывода
	const switchSpeaker = async (deviceId: string) => {
		setSelectedSpeaker(deviceId);
		localStorage.setItem('voice_chat_selected_speaker', deviceId);

		if (
			remoteAudioRef.current &&
			typeof remoteAudioRef.current.setSinkId === 'function'
		) {
			try {
				await remoteAudioRef.current.setSinkId(deviceId);
			} catch (error) {
				console.error('Ошибка Переключения динамиков:', error);
			}
		}
	};

	// Управление шумоподавлением (пропускать звук через нейросеть или нет)
	const applyNoiseMode = async (mode: TNoiseMode) => {
		// Сохраняем режим в стейт и память
		setNoiseMode(mode);
		localStorage.setItem('voice_chat_noise_mode', mode);

		const rawTrack = rawAudioTrackRef.current;

		if (!rawTrack || !localStreamRef.current) return;

		try {
			await rawTrack.applyConstraints({
				echoCancellation: true,
				noiseSuppression: mode === 'standard',
				autoGainControl: false,
			});
		} catch (err: unknown) {
			console.error('Ошибка применения ограничений аудио:', err);
		}

		const oldTrack = localStreamRef.current.getAudioTracks()[0];
		let newTrack = rawTrack;

		// Прогоняем сырой звук через нейросеть
		if (mode === 'rnnoise') {
			stopNoiseSuppression();

			// Кладем сырой трек в поток и передаем процессору
			const rawStream = new MediaStream([rawTrack]);
			const cleanTrack = await startNoiseSuppression(rawStream);

			// Отправляем собеседнику очищенный звук при рабочей нейросети
			if (cleanTrack) {
				newTrack = cleanTrack;
			}
		} else {
			stopNoiseSuppression(); // Выключаем работу нейросети в других режимах
		}

		// Физичеческая замена треков
		if (oldTrack && oldTrack !== newTrack && peerRef.current) {
			peerRef.current.replaceTrack(oldTrack, newTrack, localStreamRef.current);
			localStreamRef.current.removeTrack(oldTrack);
			localStreamRef.current.addTrack(newTrack);
		}
	};

	// Демонстрация экрана
	const toggleScreenShare = async () => {
		if (!localStreamRef.current || !peerRef.current || !isCallActiveRef.current)
			return;

		// Выключение демонстрации
		if (isScreenSharing) {
			if (screenStreamRef.current) {
				screenStreamRef.current.getTracks().forEach((track) => track.stop());
				screenStreamRef.current = null;
			}

			const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];

			if (currentVideoTrack) {
				localStreamRef.current.removeTrack(currentVideoTrack);
				peerRef.current.removeTrack(currentVideoTrack, localStreamRef.current);
			}

			setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
			dispatch(setScreenSharing(false));

			if (participant && socket) {
				socket.emit('toggleMedia', {
					to: participant._id,
					type: 'video',
					isMuted: true,
				});
			}

			return;
		}

		try {
			const screenStream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: false,
			});

			screenStreamRef.current = screenStream;

			const screenTrack = screenStream.getVideoTracks()[0];
			const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];

			if (currentVideoTrack) {
				peerRef.current.replaceTrack(
					currentVideoTrack,
					screenTrack,
					localStreamRef.current
				);
				localStreamRef.current.removeTrack(currentVideoTrack);
				currentVideoTrack.stop();
			} else {
				peerRef.current.addTrack(screenTrack, localStreamRef.current);
			}

			localStreamRef.current.addTrack(screenTrack);
			setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
			dispatch(setScreenSharing(true));

			if (participant && socket) {
				socket.emit('toggleMedia', {
					to: participant._id,
					type: 'video',
					isMuted: false,
				});
			}

			screenTrack.onended = () => toggleScreenShare();
		} catch (err: unknown) {
			console.error('Ошибка с демонстрацией экрана:', err);
		}
	};

	// Очищаем все потоки медиаданных; отвязываем потоки от DOM
	// Разрываем p2p соединение; очищаем стейты
	const cleanupMedia = useCallback(() => {
		isCallActiveRef.current = false;
		isConnectingRef.current = false;

		stopNoiseSuppression(); // Отключаем нейросеть

		if (screenStreamRef.current) {
			screenStreamRef.current.getTracks().forEach((track) => track.stop());
			screenStreamRef.current = null;
		}

		if (rawAudioTrackRef.current) {
			rawAudioTrackRef.current.stop();
			rawAudioTrackRef.current = null;
		}

		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => track.stop());
			localStreamRef.current = null;
		}

		if (localVideoRef.current) localVideoRef.current.srcObject = null;
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
		if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

		if (peerRef.current && !peerRef.current.destroyed)
			peerRef.current.destroy();

		peerRef.current = null;

		setLocalStream(null);
		setRemoteStream(null);
		socket?.off('acceptedCall');

		dispatch(endCall());
		dispatch(setScreenSharing(false));
	}, [socket, stopNoiseSuppression, dispatch]);

	// Маршрутизация входящих сигналов
	useEffect(() => {
		if (!socket) return;

		const handleSignal = (data: { signal: SignalData }) => {
			if (peerRef.current && !peerRef.current.destroyed) {
				peerRef.current.signal(data.signal);
			}
		};

		socket.on('silentSignal', handleSignal);

		return () => {
			socket.off('silentSignal', handleSignal);
		};
	}, [socket]);

	const getPeerConfig = (initiator: boolean, stream: MediaStream) => ({
		initiator,
		trickle: false,
		stream,
		config: {
			iceServers: [
				{ urls: 'stun:stun.l.google.com:19302' },
				{ urls: 'stun:global.stun.twilio.com:3478' },
			],
		},
	});

	// Исходящий звонок
	const callToFriend = async (friendToCallId: string, type: TCallType) => {
		if (!socket || isConnectingRef.current) return;
		isConnectingRef.current = true;

		const stream = await startMedia(type);

		if (!stream) {
			isConnectingRef.current = false;
			return;
		}

		const peer = new Peer(getPeerConfig(true, stream));

		let initialSignalSent = false;

		// Отправляем сигнал собеседнику через сервер
		peer.on('signal', (data) => {
			if (!initialSignalSent) {
				socket.emit('callToParticipant', {
					userToCall: friendToCallId,
					signalData: data,
					callType: type,
					mediaState: { micMuted: false, camMuted: type === 'audio' },
				});

				initialSignalSent = true;
			} else {
				socket.emit('silentSignal', { to: friendToCallId, signal: data });
			}
		});

		peer.on('stream', (str) => {
			setRemoteStream(str);
			setRemoteStreamRevision((r) => r + 1);
		});
		peer.on('track', (track, str) => {
			setRemoteStream(str);
			setRemoteStreamRevision((r) => r + 1);
		});

		peer.on('error', () => cleanupMedia());
		peer.on('close', () => cleanupMedia());

		socket.once(
			'acceptedCall',
			(data: {
				signal: SignalData;
				mediaState: { micMuted: boolean; camMuted: boolean };
			}) => {
				peer.signal(data.signal);
				dispatch(acceptCall({ mediaState: data.mediaState }));
			}
		);

		peerRef.current = peer;
	};

	// Входящий звонок
	const callFromFriend = async () => {
		if (
			!socket ||
			!incomingSignal ||
			!participant ||
			!callType ||
			isConnectingRef.current
		)
			return;

		isConnectingRef.current = true;

		const stream = await startMedia(callType);

		if (!stream) {
			isConnectingRef.current = false;
			return;
		}

		dispatch(acceptCall());

		const peer = new Peer(getPeerConfig(false, stream));

		let initialSignalSent = false;

		peer.on('signal', (data) => {
			if (!initialSignalSent) {
				socket.emit('answerCall', {
					signal: data,
					to: participant._id,
					mediaState: { micMuted: false, camMuted: callType === 'audio' },
				});
				initialSignalSent = true;
			} else {
				socket.emit('silentSignal', { to: participant._id, signal: data });
			}
		});

		peer.on('stream', (str) => {
			setRemoteStream(str);
			setRemoteStreamRevision((r) => r + 1);
		});
		peer.on('track', (track, str) => {
			setRemoteStream(str);
			setRemoteStreamRevision((r) => r + 1);
		});

		peer.on('error', () => cleanupMedia());
		peer.on('close', () => cleanupMedia());

		peer.signal(incomingSignal);
		peerRef.current = peer;
	};

	// Завершение звонка
	const completeCall = useCallback(() => {
		if (participant && socket) {
			socket.emit('endCall', { to: participant._id }); // Сообщаем серверу, что звонок завершился
		}

		cleanupMedia();
	}, [cleanupMedia, participant, socket]);

	// Слушатель при сбрасывании собеседником звонка
	useEffect(() => {
		if (!socket) return;

		socket.on('completedCall', cleanupMedia);

		return () => {
			socket.off('completedCall', cleanupMedia);
		};
	}, [socket, cleanupMedia]);

	return {
		callToFriend,
		callFromFriend,
		completeCall,
		applyNoiseMode,
		toggleScreenShare,
		toggleLocalVideo,
		toggleLocalAudio,
		switchDevice,
		switchSpeaker,
		availableMics,
		availableCams,
		availableSpeakers,
		selectedMic,
		selectedCam,
		selectedSpeaker,
		noiseMode,
		localVideoRef,
		remoteVideoRef,
		remoteAudioRef,
		localStream,
		remoteStream,
		remoteStreamRevision,
	};
};
