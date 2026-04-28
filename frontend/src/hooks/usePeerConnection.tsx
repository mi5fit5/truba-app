import { useRef, useState } from 'react';
import Peer, { type Instance, type SignalData } from 'simple-peer';

import { useDispatch, useSelector } from '@store';
import {
	acceptCall,
	endCall,
	selectCallType,
	selectIncomingSignal,
	selectParticipant,
} from '@slices';
import { useSocketInstance } from '@hooks';
import type { TCallType } from '@types';

export const usePeerConnection = () => {
	const dispatch = useDispatch();
	const socket = useSocketInstance();

	const incomingSignal = useSelector(selectIncomingSignal);
	const participant = useSelector(selectParticipant);
	const callType = useSelector(selectCallType);

	// Стейты для потоков
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

	// Рефы для работы с DOM-элементами
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);

	// Реф для хранения соединения
	const peerRef = useRef<Instance | null>(null);

	// Захват видео и аудио
	const startMedia = async (type: TCallType) => {
		try {
			// Запрос прав доступа у браузера (видео и аудио)
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true, // Аудио включено всегда!
				video: type === 'video',
			});

			setLocalStream(stream);

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

	// Исходящий звонок
	const callToFriend = async (friendToCallId: string, type: TCallType) => {
		if (!socket) return;

		const stream = await startMedia(type);
		if (!stream) return;

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

		// Единожды ждем ответа собеседника
		socket.once('acceptedCall', (signal: SignalData) => {
			peer.signal(signal);
			dispatch(acceptCall());
		});

		peerRef.current = peer;
	};

	// Входящий звонок
	const callFromFriend = async () => {
		if (!socket || !incomingSignal || !participant || !callType) return;

		const stream = await startMedia(callType);
		if (!stream) return;

		dispatch(acceptCall());

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
	const completeCall = () => {
		// Разрываем peer-to-peer туннель
		if (peerRef.current) {
			peerRef.current.destroy();
		}

		// Останавливаем все медиа-треки
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
		}

		// Сообщаем серверу, что звонок завершился
		if (participant && socket) {
			socket.emit('endCall', { to: participant._id });
		}

		// Очищаем стейты и удаляем слушатель
		setLocalStream(null);
		setRemoteStream(null);
		socket?.off('acceptedCall');

		dispatch(endCall());
	};

	return {
		callToFriend,
		callFromFriend,
		completeCall,
		localVideoRef,
		remoteVideoRef,
		localStream,
		remoteStream,
	};
};
