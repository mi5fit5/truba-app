import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { type Instance, type SignalData } from 'simple-peer';

import { useDispatch, useSelector } from '@store';
import {
	acceptCall,
	endCall,
	selectCallType,
	selectIncomingSignal,
	selectParticipant,
} from '@slices';
import { useSocketInstance } from '../contexts';
import type { TCallType, TSelectOption } from '@types';

import { truncateOptionsText } from '@utils/textUtils';

// Хук для управления WebRTC-соединением
export const usePeerConnection = () => {
	const dispatch = useDispatch();
	const socket = useSocketInstance();

	const incomingSignal = useSelector(selectIncomingSignal);
	const participant = useSelector(selectParticipant);
	const callType = useSelector(selectCallType);

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

	// Рефы для работы с DOM-элементами; хранения соединения и потока; активности звонка; пустого видео
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const peerRef = useRef<Instance | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const isCallActiveRef = useRef<boolean>(false);
	const isDummyVideoRef = useRef<boolean>(false);

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
				audio: true, // Аудио включено всегда!
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

			// Привязываем видео, только если это видеозвонок
			if (type === 'video' && localVideoRef.current) {
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
      if (!isCallActiveRef.current || !localStreamRef.current || !peerRef.current) {
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

	// Физическое переключение медиа-устройств
	const switchDevice = async (type: 'audio' | 'video', deviceId: string) => {
		if (!localStreamRef.current || !peerRef.current) return;

		try {
			// Запрос нового потока с устройства
			const specificDeviceStream = {
				[type]: { deviceId: { exact: deviceId } },
			};

			const newStream =
				await navigator.mediaDevices.getUserMedia(specificDeviceStream);

      // Проверка статуса звонка
			if (
				!isCallActiveRef.current ||
				!localStreamRef.current ||
				!peerRef.current
			) {
				newStream.getTracks().forEach((track) => track.stop());
				return;
			}

			const newTrack =
				type === 'audio'
					? newStream.getAudioTracks()[0]
					: newStream.getVideoTracks()[0];

			const oldTrack =
				type === 'audio'
					? localStreamRef.current.getAudioTracks()[0]
					: localStreamRef.current.getVideoTracks()[0];

			if (oldTrack && newTrack) {
				// Заменяем трек у собеседника
				peerRef.current.replaceTrack(
					oldTrack,
					newTrack,
					localStreamRef.current
				);

				// Удаление старого трека и останавливаем его
				localStreamRef.current.removeTrack(oldTrack);
				oldTrack.stop();

				localStreamRef.current.addTrack(newTrack);

				// Пересоздание медиапотока
				const updatedStream = new MediaStream(
					localStreamRef.current.getTracks()
				);
				setLocalStream(updatedStream);

				if (type === 'video' && localVideoRef.current) {
					localVideoRef.current.srcObject = updatedStream;
				}
			}
		} catch (err: unknown) {
			console.error(`Ошибка переключения ${type}-устройства:`, err);
		}
	};

	// Очищаем все потоки медиаданных; отвязываем потоки от DOM
	// Разрываем p2p соединение; очищаем стейты
	const cleanupMedia = useCallback(() => {
		isCallActiveRef.current = false;

		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => track.stop());
			localStreamRef.current = null;
		}

		if (localVideoRef.current) localVideoRef.current.srcObject = null;
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

		if (peerRef.current) {
			peerRef.current.destroy();
			peerRef.current = null;
		}

		setLocalStream(null);
		setRemoteStream(null);
		socket?.off('acceptedCall');
	}, [socket]);

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

			// Привязываем вебку собеседника
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = currentStream;
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

			// Привязываем вебку собеседника
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = currentStream;
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
		availableMics,
		availableCams,
		selectedMic,
		selectedCam,
		isDummyVideoRef,
		localVideoRef,
		remoteVideoRef,
		localStream,
		remoteStream,
	};
};
