import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Peer, { type Instance, type SignalData } from 'simple-peer';

import type { TCallType, TNoiseMode, TSelectOption } from '@types';
import { useDispatch, useSelector } from '@store';
import {
	acceptCall,
	endCall,
	selectCallStatus,
	selectCallType,
	selectIncomingSignal,
	selectIsScreenSharing,
	selectParticipant,
	setScreenSharing,
} from '@slices';
import { useSocketInstance } from '@context';
import { useAudioProcessor } from '@hooks';

import { truncateOptionsText } from '@utils/textUtils';
import { playSystemSound } from '@utils/audioUtils';
import { peerRequests } from '@utils/api';
import { declineCallSound } from '@audio';

interface IDummyMediaTrack extends MediaStreamTrack {
	isDummyTrack?: boolean;
}

// Глобальный кэш холста для заглушки
let dummyCanvas: HTMLCanvasElement | null = null;

// Функция создания заглушки для аудиозвонка
const createDummyVideoTrack = (): IDummyMediaTrack => {
	if (!dummyCanvas) {
		dummyCanvas = document.createElement('canvas');
		dummyCanvas.width = 640;
		dummyCanvas.height = 480;
		const ctx = dummyCanvas.getContext('2d');

		if (ctx) {
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, dummyCanvas.width, dummyCanvas.height);
			setInterval(() => {
				ctx.fillRect(0, 0, 1, 1);
			}, 1000);
		}
	}

	const stream = dummyCanvas.captureStream(15);
	const track = stream.getVideoTracks()[0] as IDummyMediaTrack;

	track.enabled = false;
	track.isDummyTrack = true;

	return track;
};

// Публичные STUN-сервера для фолбэка
const FALLBACK_ICE_SERVERS = [
	{ urls: 'stun:stun.l.google.com:19302' },
	{ urls: 'stun:global.stun.twilio.com:3478' },
];

// Функция для получения конфигурации WebRTC-соединения
const getPeerConfig = (
	initiator: boolean,
	stream: MediaStream,
	iceServers: RTCIceServer[]
) => ({
	initiator,
	trickle: true,
	stream,
	config: { iceServers },
});

// Хук для управления WebRTC-соединением
export const usePeerConnection = () => {
	const dispatch = useDispatch();
	const socket = useSocketInstance();

	const incomingSignal = useSelector(selectIncomingSignal);
	const participant = useSelector(selectParticipant);
	const callType = useSelector(selectCallType);
	const isScreenSharing = useSelector(selectIsScreenSharing);
	const callStatus = useSelector(selectCallStatus);

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

	// Рефы для работы с DOM-элементами; хранения соединения и потока; активности звонка;
	// демонстрации экрана; актуальных значений устройств, шумодава и статуса; ICE-серверы
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const remoteAudioRef = useRef<HTMLAudioElement>(null);
	const peerRef = useRef<Instance | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const isCallActiveRef = useRef<boolean>(false);
	const screenStreamRef = useRef<MediaStream | null>(null);
	const isConnectingRef = useRef<boolean>(false);
	const selectedMicRef = useRef(selectedMic);
	const selectedCamRef = useRef(selectedCam);
	const noiseModeRef = useRef(noiseMode);
	const callStatusRef = useRef(callStatus);
	const isScreenSharingRef = useRef(isScreenSharing);
	const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE_SERVERS);

	useEffect(() => {
		selectedMicRef.current = selectedMic;
	}, [selectedMic]);
	useEffect(() => {
		selectedCamRef.current = selectedCam;
	}, [selectedCam]);
	useEffect(() => {
		noiseModeRef.current = noiseMode;
	}, [noiseMode]);
	useEffect(() => {
		callStatusRef.current = callStatus;
	}, [callStatus]);
	useEffect(() => {
		isScreenSharingRef.current = isScreenSharing;
	}, [isScreenSharing]);

	// Вспомогательная функция для динамического получения аппаратного стейта
	const getCurrentMediaState = useCallback(() => {
		const audioTrack = localStreamRef.current?.getAudioTracks()[0];
		const videoTrack = localStreamRef.current?.getVideoTracks()[0] as
			| IDummyMediaTrack
			| undefined;

		return {
			micMuted: audioTrack ? !audioTrack.enabled : false,
			camMuted: videoTrack
				? !videoTrack.enabled || !!videoTrack.isDummyTrack
				: true,
		};
	}, []);

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

	// Получение ICE-конфигурации (STUN/TURN) с сервера
	const fetchIceServers = useCallback(async () => {
		try {
			const { data } = await peerRequests.getIceServers();

			if (Array.isArray(data) && data.length > 0) {
				iceServersRef.current = data;
			}
		} catch (err: unknown) {
			console.warn('Не удалось получить ICE-серверы, используем фолбэк:', err);
		}
	}, []);

	// Загружаем ICE-конфигурацию при монтировании
	useEffect(() => {
		fetchIceServers();
	}, [fetchIceServers]);

	// Управление шумоподавлением (пропускать звук через нейросеть или нет)
	const applyNoiseMode = useCallback(
		async (mode: TNoiseMode) => {
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
				peerRef.current.replaceTrack(
					oldTrack,
					newTrack,
					localStreamRef.current
				);
				localStreamRef.current.removeTrack(oldTrack);
				localStreamRef.current.addTrack(newTrack);
			}
		},
		[startNoiseSuppression, stopNoiseSuppression]
	);

	// Захват видео и аудио
	const startMedia = useCallback(
		async (type: TCallType) => {
			try {
				isCallActiveRef.current = true;

				// Очищаем старые потоки
				if (localStreamRef.current) {
					localStreamRef.current.getTracks().forEach((track) => track.stop());
				}

				// Ограничения
				const audioConstraints = {
					deviceId: selectedMicRef.current
						? { ideal: selectedMicRef.current }
						: undefined,
					echoCancellation: true,
					noiseSuppression: noiseModeRef.current === 'standard',
					autoGainControl: false,
				};

				const videoConstraints =
					type === 'video'
						? selectedCamRef.current
							? { deviceId: { ideal: selectedCamRef.current } }
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

				if (type === 'audio') {
					const dummyTrack = createDummyVideoTrack();
					stream.addTrack(dummyTrack);
				}

				setLocalStream(stream);
				localStreamRef.current = stream;
				rawAudioTrackRef.current = stream.getAudioTracks()[0];

				await applyNoiseMode(noiseModeRef.current);

				return stream;
			} catch (err: unknown) {
				console.error('Ошибка медиа:', err);
				return null;
			}
		},
		[applyNoiseMode]
	);

	// Управление видео
	const toggleLocalVideo = useCallback(async (): Promise<boolean> => {
		if (!localStreamRef.current || !peerRef.current) return false;

		const currentVideoTrack =
			localStreamRef.current.getVideoTracks()[0] as IDummyMediaTrack;
		const isRealCamera = currentVideoTrack && !currentVideoTrack.isDummyTrack;

		if (isRealCamera) {
			const dummyTrack = createDummyVideoTrack();

			try {
				if (!peerRef.current.destroyed) {
					peerRef.current.replaceTrack(
						currentVideoTrack,
						dummyTrack,
						localStreamRef.current
					);
				}
			} catch (err: unknown) {
				console.warn('Ошибка замены на заглушку:', err);
			}

			localStreamRef.current.removeTrack(currentVideoTrack);
			currentVideoTrack.stop();

			localStreamRef.current.addTrack(dummyTrack);
			setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

			if (participant && socket) {
				socket.emit('toggleMedia', {
					to: participant._id,
					type: 'video',
					isMuted: true,
				});
			}

			return false;
		} else {
			try {
				const camStream = await navigator.mediaDevices.getUserMedia({
					video: selectedCamRef.current
						? { deviceId: { ideal: selectedCamRef.current } }
						: true,
				});
				const newRealTrack = camStream.getVideoTracks()[0];

				if (currentVideoTrack) {
					try {
						if (!peerRef.current.destroyed) {
							peerRef.current.replaceTrack(
								currentVideoTrack,
								newRealTrack,
								localStreamRef.current
							);
						}
					} catch (err: unknown) {
						console.warn('Ошибка замены на реальную камеру', err);
					}

					localStreamRef.current.removeTrack(currentVideoTrack);
					currentVideoTrack.stop();
				}

				localStreamRef.current.addTrack(newRealTrack);
				setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

				if (participant && socket) {
					socket.emit('toggleMedia', {
						to: participant._id,
						type: 'video',
						isMuted: false,
					});
				}

				return true;
			} catch (err: unknown) {
				console.error('Отсутствует доступ к камере:', err);
				return false;
			}
		}
	}, [participant, socket]);

	// Управление аудио
	const toggleLocalAudio = useCallback((): boolean => {
		if (!localStreamRef.current) return false;

		const audioTrack = localStreamRef.current.getAudioTracks()[0];

		if (audioTrack) {
			audioTrack.enabled = !audioTrack.enabled;

			if (participant && socket) {
				socket.emit('toggleMedia', {
					to: participant._id,
					type: 'audio',
					isMuted: !audioTrack.enabled,
				});
			}

			return audioTrack.enabled;
		}
		return false;
	}, [participant, socket]);

	// Переключение устройства (микрофон, камера) / шумодава
	const switchDevice = useCallback(
		async (type: 'audio' | 'video', deviceId: string) => {
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

				const newStream =
					await navigator.mediaDevices.getUserMedia(constraints);
				const newTrack =
					type === 'audio'
						? newStream.getAudioTracks()[0]
						: newStream.getVideoTracks()[0];

				const oldTrack =
					type === 'audio'
						? localStreamRef.current.getAudioTracks()[0]
						: localStreamRef.current.getVideoTracks()[0];

				if (oldTrack && newTrack) {
					if (peerRef.current.destroyed) return;

					if (type === 'audio') {
						// Сохраняем ссылку на старый сырой трек для последующей остановки
						const previousRawTrack = rawAudioTrackRef.current;
						rawAudioTrackRef.current = newTrack;

						await applyNoiseMode(noiseModeRef.current);

						// Останавливаем старый сырой трек микрофона после замены
						if (previousRawTrack && previousRawTrack !== newTrack) {
							previousRawTrack.stop();
						}

						setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
					} else {
						// Прямая замена видео-трека
						peerRef.current.replaceTrack(
							oldTrack,
							newTrack,
							localStreamRef.current
						);
						localStreamRef.current.removeTrack(oldTrack);
						oldTrack.stop();
						localStreamRef.current.addTrack(newTrack);

						setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
					}
				}
			} catch (err: unknown) {
				console.error(`Ошибка переключения ${type}:`, err);
			}
		},
		[applyNoiseMode]
	);

	// Переключение устройства вывода
	const switchSpeaker = useCallback(async (deviceId: string) => {
		setSelectedSpeaker(deviceId);
		localStorage.setItem('voice_chat_selected_speaker', deviceId);

		if (
			remoteAudioRef.current &&
			typeof remoteAudioRef.current.setSinkId === 'function'
		) {
			try {
				await remoteAudioRef.current.setSinkId(deviceId);
			} catch (error) {
				console.error('Ошибка переключения динамиков:', error);
			}
		}
	}, []);

	// Проверка поддержки демонстрации экрана на устройстве
	const isScreenShareSupported = useMemo(() => {
		return (
			typeof navigator !== 'undefined' &&
			!!navigator.mediaDevices &&
			typeof navigator.mediaDevices.getDisplayMedia === 'function'
		);
	}, []);

	// Демонстрация экрана
	const toggleScreenShare = useCallback(
		async function performToggleScreenShare(): Promise<boolean> {
			if (
				!localStreamRef.current ||
				!peerRef.current ||
				!isCallActiveRef.current
			)
				return false;

			const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];

			// Выключение демонстрации
			if (isScreenSharingRef.current) {
				if (screenStreamRef.current) {
					screenStreamRef.current.getTracks().forEach((track) => track.stop());
					screenStreamRef.current = null;
				}

				if (currentVideoTrack) {
					const dummyTrack = createDummyVideoTrack();

					try {
						if (!peerRef.current.destroyed) {
							peerRef.current.replaceTrack(
								currentVideoTrack,
								dummyTrack,
								localStreamRef.current
							);
						}
					} catch (err: unknown) {
						console.warn('Ошибка заглушки экрана:', err);
					}

					localStreamRef.current.removeTrack(currentVideoTrack);
					currentVideoTrack.stop();
					localStreamRef.current.addTrack(dummyTrack);
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

				return false;
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
					if (peerRef.current.destroyed) return false;

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

				screenTrack.onended = () => {
					if (isCallActiveRef.current) {
						performToggleScreenShare();
					}
				};

				return true;
			} catch (err: unknown) {
				console.error('Ошибка с демонстрацией экрана:', err);
				return false;
			}
		},
		[dispatch, participant, socket]
	);

	// Очищаем все потоки медиаданных; отвязываем потоки от DOM
	// Разрываем p2p соединение; очищаем стейты
	const cleanupMedia = useCallback(() => {
		isCallActiveRef.current = false;
		isConnectingRef.current = false;

		// Воспроизводим звук отклонения, если звонок не был установлен
		if (
			callStatusRef.current === 'calling' ||
			callStatusRef.current === 'receiving'
		) {
			playSystemSound(declineCallSound);
		}

		stopNoiseSuppression(); // Отключаем нейросеть

		if (screenStreamRef.current) {
			screenStreamRef.current.getTracks().forEach((track) => {
				track.onended = null;
				track.stop();
			});
			screenStreamRef.current = null;
		}

		if (
			rawAudioTrackRef.current &&
			rawAudioTrackRef.current.readyState === 'live'
		) {
			rawAudioTrackRef.current.stop();
		}
		rawAudioTrackRef.current = null;

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

		dispatch(endCall());
		dispatch(setScreenSharing(false));
	}, [stopNoiseSuppression, dispatch]);

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

	// Исходящий звонок
	const callToFriend = useCallback(
		async (friendToCallId: string, type: TCallType) => {
			if (!socket || isConnectingRef.current) return;
			isConnectingRef.current = true;

			// Обновляем ICE-конфигурацию перед звонком
			await fetchIceServers();

			const stream = await startMedia(type);

			if (!stream) {
				isConnectingRef.current = false;
				return;
			}

			const peer = new Peer(getPeerConfig(true, stream, iceServersRef.current));

			let initialSignalSent = false;
			let callAccepted = false;
			const pendingSignals: SignalData[] = [];

			// Отправляем сигнал собеседнику через сервер
			peer.on('signal', (data) => {
				if (!initialSignalSent) {
					socket.emit('callToParticipant', {
						userToCall: friendToCallId,
						signalData: data,
						callType: type,
						mediaState: getCurrentMediaState(),
					});

					initialSignalSent = true;
				} else if (callAccepted) {
					socket.emit('silentSignal', { to: friendToCallId, signal: data });
				} else {
					pendingSignals.push(data);
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

			peer.on('iceStateChange', (iceConnectionState: string) => {
				if (iceConnectionState === 'failed') {
					console.warn(
						`ICE-соединение: ${iceConnectionState}, разрываем звонок`
					);
					socket.emit('endCall', { to: friendToCallId });
					cleanupMedia();
				}
			});

			socket.once(
				'acceptedCall',
				(data: {
					signal: SignalData;
					mediaState: { micMuted: boolean; camMuted: boolean };
				}) => {
					if (peer.destroyed) return;

					callAccepted = true;
					peer.signal(data.signal);
					dispatch(acceptCall({ mediaState: data.mediaState }));

					pendingSignals.forEach((signal) => {
						socket.emit('silentSignal', { to: friendToCallId, signal });
					});
					pendingSignals.length = 0;
				}
			);

			peerRef.current = peer;
		},
		[
			socket,
			startMedia,
			getCurrentMediaState,
			dispatch,
			cleanupMedia,
			fetchIceServers,
		]
	);

	// Входящий звонок
	const callFromFriend = useCallback(async () => {
		if (
			!socket ||
			!incomingSignal ||
			!participant ||
			!callType ||
			isConnectingRef.current
		)
			return;

		isConnectingRef.current = true;

		// Обновляем ICE-конфигурацию перед ответом
		await fetchIceServers();

		const stream = await startMedia(callType);

		if (!stream) {
			isConnectingRef.current = false;
			return;
		}

		dispatch(acceptCall());

		const peer = new Peer(getPeerConfig(false, stream, iceServersRef.current));

		let initialSignalSent = false;

		peer.on('signal', (data) => {
			if (!initialSignalSent) {
				socket.emit('answerCall', {
					signal: data,
					to: participant._id,
					mediaState: getCurrentMediaState(),
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

		// Мониторинг ICE-состояния
		peer.on('iceStateChange', (iceConnectionState: string) => {
			if (iceConnectionState === 'failed') {
				console.warn(`ICE-соединение: ${iceConnectionState}, разрываем звонок`);
				socket.emit('endCall', { to: participant._id });
				cleanupMedia();
			}
		});

		peer.signal(incomingSignal);
		peerRef.current = peer;
	}, [
		socket,
		incomingSignal,
		participant,
		callType,
		startMedia,
		dispatch,
		fetchIceServers,
		getCurrentMediaState,
		cleanupMedia,
	]);

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

	const peerContextValue = useMemo(
		() => ({
			callToFriend,
			callFromFriend,
			completeCall,
			applyNoiseMode,
			toggleScreenShare,
			toggleLocalVideo,
			toggleLocalAudio,
			switchDevice,
			switchSpeaker,
			isScreenShareSupported,
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
		}),
		[
			callToFriend,
			callFromFriend,
			completeCall,
			applyNoiseMode,
			toggleScreenShare,
			toggleLocalVideo,
			toggleLocalAudio,
			switchDevice,
			switchSpeaker,
			isScreenShareSupported,
			availableMics,
			availableCams,
			availableSpeakers,
			selectedMic,
			selectedCam,
			selectedSpeaker,
			noiseMode,
			localStream,
			remoteStream,
			remoteStreamRevision,
		]
	);

	return peerContextValue;
};
