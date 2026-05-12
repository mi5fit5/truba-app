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

	// Стейты для списков доступных устройств + переменные для хранения активных устройств
	const [availableMics, setAvailableMics] = useState<TSelectOption[]>([]);
	const [availableCams, setAvailableCams] = useState<TSelectOption[]>([]);
	const selectedMic =
		localStream?.getAudioTracks()[0]?.getSettings().deviceId || '';
	const selectedCam =
		localStream?.getVideoTracks()[0]?.getSettings().deviceId || '';

	// Рефы для работы с DOM-элементами; хранения соединения и потока;
	// активности звонка; пустого видео; демонстрации экрана
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const remoteAudioRef = useRef<HTMLAudioElement>(null);
	const peerRef = useRef<Instance | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const isCallActiveRef = useRef<boolean>(false);
	const isDummyVideoRef = useRef<boolean>(false);
	const screenTrackRef = useRef<MediaStreamTrack | null>(null);

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

				setAvailableMics(audioDevices);
				setAvailableCams(videoDevices);
			})
			.catch((err) =>
				console.error('Ошибка получения списка доступных устройств:', err)
			);
	}, []);

	// Создание пустого видео-трека
	const createEmptyVideoTrack = () => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		canvas.width = 640;
		canvas.height = 480;

		if (ctx) {
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		const stream = canvas.captureStream(30);
		const track = stream.getVideoTracks()[0];
		track.enabled = false;

		return track;
	};

	// Захват видео и аудио
	const startMedia = async (type: TCallType) => {
		try {
			isCallActiveRef.current = true;

			// Очищаем старые потоки
			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach((track) => track.stop());
				localStreamRef.current = null;
			}

			// Запрос медиа-устрйств
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					// Стандартное шумоподавление WebRTC включено по умолчанию
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
				video: type === 'video',
			});

			// Добавляем пустое видео, если это аудиозвонок
			isDummyVideoRef.current = type !== 'video';

			if (type !== 'video') {
				const dummyVideoTrack = createEmptyVideoTrack();
				stream.addTrack(dummyVideoTrack);
			}

			// Проверка на случай, если пользователь сбросил звонок
			if (!isCallActiveRef.current) {
				stream.getTracks().forEach((track) => track.stop());
				return null;
			}

			// Сохраняем поток
			setLocalStream(stream);
			localStreamRef.current = stream;

			// Сохраняем сырой звук для работы нейросети
			rawAudioTrackRef.current = stream.getAudioTracks()[0];

			// Привязываем видео
			if (localVideoRef.current) {
				localVideoRef.current.srcObject = stream;
			}

			return stream;
		} catch (err: unknown) {
			console.error('Ошибка доступа к устройствам:', err);
			return null;
		}
	};

	// Добавление видео-трека в аудиозвонок
	const upgradeVideoTrack = async () => {
		if (!localStreamRef.current || !peerRef.current) return null;

		try {
			// Запрос доступ к камере
			const newStream = await navigator.mediaDevices.getUserMedia({
				video: true,
			});

			// Проверка статуса звонка
			if (
				!isCallActiveRef.current ||
				!localStreamRef.current ||
				!peerRef.current
			) {
				newStream.getTracks().forEach((track) => track.stop());
				return null;
			}

			const newVideoTrack = newStream.getVideoTracks()[0];
			const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];

			// Подменяем трек внутри активного соединения
			if (oldVideoTrack) {
				peerRef.current.replaceTrack(
					oldVideoTrack,
					newVideoTrack,
					localStreamRef.current
				);
				localStreamRef.current.removeTrack(oldVideoTrack); // Удаляем пустое видео из локального потока
			}

			localStreamRef.current.addTrack(newVideoTrack);
			isDummyVideoRef.current = false;

			// Пересоздание медиапотока
			const updatedStream = new MediaStream(localStreamRef.current.getTracks());
			setLocalStream(updatedStream);

			if (localVideoRef.current) {
				localVideoRef.current.srcObject = updatedStream;
			}

			return newVideoTrack;
		} catch (err: unknown) {
			console.error('Ошибка переключения камеры:', err);
			return null;
		}
	};

	// Управление шумоподавлением (пропускать звук через нейросеть или нет)
	const applyNoiseMode = async (mode: TNoiseMode) => {
		const rawTrack = rawAudioTrackRef.current;

		if (!rawTrack || !localStreamRef.current) return;

		// Если 'standard' - включаем стандартное шумоподавление WebRTC
		const isStandard = mode === 'standard';

		try {
			await rawTrack.applyConstraints({
				echoCancellation: true,
				noiseSuppression: isStandard,
				autoGainControl: false,
			});
		} catch (err: unknown) {
			console.error('Ошибка применения ограничений аудио:', err);
		}

		const oldTrackToSend = localStreamRef.current.getAudioTracks()[0];
		let newTrackToSend = rawTrack;

		// Прогоняем сырой звук через нейросеть
		if (mode === 'rnnoise') {
			stopNoiseSuppression();

			// Кладем сырой трек в поток и передаем процессору
			const rawStream = new MediaStream([rawTrack]);
			const cleanTrack = await startNoiseSuppression(rawStream);

			// Отправляем собеседнику очищенный звук при рабочей нейросети
			if (cleanTrack) {
				newTrackToSend = cleanTrack;
			}
		} else {
			stopNoiseSuppression(); // Выключаем работу нейросети в других режимах
		}

		// Физичеческая замена треков
		if (oldTrackToSend && oldTrackToSend !== newTrackToSend) {
			if (peerRef.current) {
				peerRef.current.replaceTrack(
					// Замена трека в P2P соединении
					oldTrackToSend,
					newTrackToSend,
					localStreamRef.current
				);
			}

			// Обновление локального стейта потока
			localStreamRef.current.removeTrack(oldTrackToSend);
			localStreamRef.current.addTrack(newTrackToSend);
		}
	};

	// Физическое переключение медиа-устройств (смена вебки или микрофона)
	const switchDevice = async (
		type: 'audio' | 'video',
		deviceId: string,
		currentNoiseMode: TNoiseMode = 'standard'
	) => {
		if (!localStreamRef.current || !peerRef.current) return;

		try {
			// Формируем настройки в зависимости от типа устройства
			const constraints: MediaStreamConstraints =
				type === 'audio'
					? { audio: { deviceId: { exact: deviceId } } }
					: { video: { deviceId: { exact: deviceId } } };

			const newStream = await navigator.mediaDevices.getUserMedia(constraints);

			// Проверка статуса звонка
			if (
				!isCallActiveRef.current ||
				!localStreamRef.current ||
				!peerRef.current
			) {
				newStream.getTracks().forEach((track) => track.stop());
				return;
			}

			if (type === 'audio') {
				const newRawAudio = newStream.getAudioTracks()[0];
				const oldRawAudio = rawAudioTrackRef.current;

				if (oldRawAudio) oldRawAudio.stop(); // Отключаем старое устройство

				rawAudioTrackRef.current = newRawAudio;
				await applyNoiseMode(currentNoiseMode); // Пропускаем новое аудио-устройство через нейронку
			} else {
				// Берем новый видео-трек и сразу заменяем старый
				const newTrack = newStream.getVideoTracks()[0];
				const oldTrack = localStreamRef.current.getVideoTracks()[0];

				if (oldTrack && newTrack) {
					peerRef.current.replaceTrack(
						oldTrack,
						newTrack,
						localStreamRef.current
					);
					localStreamRef.current.removeTrack(oldTrack);
					oldTrack.stop();
					localStreamRef.current.addTrack(newTrack);

					const updatedStream = new MediaStream(
						localStreamRef.current.getTracks()
					);
					setLocalStream(updatedStream);
					if (localVideoRef.current)
						localVideoRef.current.srcObject = updatedStream;
				}
			}
		} catch (err: unknown) {
			console.error(`Ошибка переключения ${type}-устройства:`, err);
		}
	};

	// Отключение камеры
	const disableCamera = () => {
		if (!localStreamRef.current || !peerRef.current || isDummyVideoRef.current)
			return;

		const oldTrack = localStreamRef.current.getVideoTracks()[0];
		const dummyTrack = createEmptyVideoTrack(); // Создаем пустой видео-трек

		// Заменяем трек
		peerRef.current.replaceTrack(oldTrack, dummyTrack, localStreamRef.current);

		localStreamRef.current.removeTrack(oldTrack);
		oldTrack.stop(); // Останавливаем текущий трек
		localStreamRef.current.addTrack(dummyTrack);

		isDummyVideoRef.current = true;

		const updatedStream = new MediaStream(localStreamRef.current.getTracks());
		setLocalStream(updatedStream);

		if (localVideoRef.current) {
			localVideoRef.current.srcObject = updatedStream;
		}
	};

	// Демонстрация экрана
	const toggleScreenShare = async () => {
		if (!localStreamRef.current || !peerRef.current || !isCallActiveRef.current)
			return;

		try {
			// Выключение демонстрации
			if (isScreenSharing) {
				if (isScreenSharing) {
					if (screenTrackRef.current) {
						// Отвязываем обработчик закрытия экрана
						screenTrackRef.current.onended = null;
						screenTrackRef.current = null;
					}

					disableCamera(); // Возвращаем аватарку вместо запроса камеры

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
			}

			// Включение
			const screenStream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: false,
			});
			const screenTrack = screenStream.getVideoTracks()[0];
			screenTrackRef.current = screenTrack; // Сохраняем в реф для очистки при сбросе

			const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];

			if (currentVideoTrack && screenTrack) {
				// Заменяем трек экраном
				peerRef.current.replaceTrack(
					currentVideoTrack,
					screenTrack,
					localStreamRef.current
				);

				isDummyVideoRef.current = false;

				// Обновляем локальный поток
				localStreamRef.current.removeTrack(currentVideoTrack);
				currentVideoTrack.stop(); // Останавливаем камеру
				localStreamRef.current.addTrack(screenTrack);

				// Обновляем видео-элемент
				const updatedStream = new MediaStream(
					localStreamRef.current.getTracks()
				);
				setLocalStream(updatedStream);

				if (localVideoRef.current) {
					localVideoRef.current.srcObject = updatedStream;
				}

				dispatch(setScreenSharing(true));

				if (participant && socket) {
					socket.emit('toggleMedia', {
						to: participant._id,
						type: 'video',
						isMuted: false,
					});
				}
				// Возвращаем камеру, если пользователь отменил демонстрацию экрана в браузере
				screenTrack.onended = async () => {
					await toggleScreenShare();
				};
			}
		} catch (err: unknown) {
			console.error('Ошибка с демонстрацией экрана:', err);
		}
	};

	// Очищаем все потоки медиаданных; отвязываем потоки от DOM
	// Разрываем p2p соединение; очищаем стейты
	const cleanupMedia = useCallback(() => {
		isCallActiveRef.current = false;

		stopNoiseSuppression(); // Отключаем нейросеть

		if (screenTrackRef.current) {
			screenTrackRef.current.onended = null;
			screenTrackRef.current.stop();
			screenTrackRef.current = null;
		}

		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => track.stop());
			localStreamRef.current = null;
		}

		if (localVideoRef.current) localVideoRef.current.srcObject = null;
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
		if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

		if (peerRef.current) {
			peerRef.current.destroy();
			peerRef.current = null;
		}

		setLocalStream(null);
		setRemoteStream(null);
		socket?.off('acceptedCall');

		dispatch(setScreenSharing(false));
	}, [socket, stopNoiseSuppression, dispatch]);

	// Исходящий звонок
	const callToFriend = async (friendToCallId: string, type: TCallType) => {
		if (!socket) return;

		const stream = await startMedia(type);
		if (!stream) return;

		// Начальные стейты аудио/видео для отправки собеседнику
		const initialMediaState = {
			micMuted: false,
			camMuted: type === 'audio',
		};

		// Создаем инициатора звонка
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream,
		});

		// Отправляем сигнал собеседнику через сервер
		peer.on('signal', (data) => {
			socket.emit('callToParticipant', {
				userToCall: friendToCallId,
				signalData: data,
				callType: type,
				mediaState: initialMediaState,
			});
		});

		// При ответе получаем видео собеседника
		peer.on('stream', (currentStream) => {
			setRemoteStream(currentStream);

			// Передаем оригинальные потоки
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = currentStream;
			}

			if (remoteAudioRef.current) {
				remoteAudioRef.current.srcObject = currentStream;
			}
		});

		// Получаем ответ от собеседника вместе с его актуальными стейтами
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
		if (!socket || !incomingSignal || !participant || !callType) return;

		const stream = await startMedia(callType);
		if (!stream) return;

		dispatch(acceptCall());

		// Начальные стейты для ответа инициатору
		const initialMediaState = {
			micMuted: false,
			camMuted: callType === 'audio',
		};

		// Отвечает на готовый сигнал от собеседника
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream,
		});

		// Отправляем ответ инициатору звонка
		peer.on('signal', (data) => {
			socket.emit('answerCall', {
				signal: data,
				to: participant._id,
				mediaState: initialMediaState,
			});
		});

		// Получаем видеопоток от звонящего
		peer.on('stream', (currentStream) => {
			setRemoteStream(currentStream);

			// Передаем оригинальные потоки
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = currentStream;
			}

			if (remoteAudioRef.current) {
				remoteAudioRef.current.srcObject = currentStream;
			}
		});

		peer.signal(incomingSignal);
		peerRef.current = peer;
	};

	// Завершение звонка
	const completeCall = useCallback(() => {
		if (participant && socket) {
			socket.emit('endCall', { to: participant._id }); // Сообщаем серверу, что звонок завершился
		}

		cleanupMedia();
		dispatch(endCall());
	}, [cleanupMedia, dispatch, participant, socket]);

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
		upgradeVideoTrack,
		switchDevice,
		applyNoiseMode,
		disableCamera,
		toggleScreenShare,
		availableMics,
		availableCams,
		selectedMic,
		selectedCam,
		isDummyVideoRef,
		localVideoRef,
		remoteVideoRef,
		remoteAudioRef,
		localStream,
		remoteStream,
	};
};
