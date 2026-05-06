import { useCallback, useContext, useEffect, useState } from 'react';

import { SocketContext, usePeerContext } from '@context';
import { useSelector } from '@store';
import {
	selectCallStatus,
	selectCallType,
	selectParticipant,
	selectUserData,
} from '@slices';

import { Avatar, Button, Modal, Text, Window } from '@ui';

import styles from './ActiveCallModal.module.scss';
import {
	mutedSoundIcon,
	networkModalIcon,
	rejectIcon,
	settingsIcon,
	toggleCamera,
	toggleMic,
} from '@icons';

interface ActiveCallModalProps {
	onEndCall: () => void;
}

export const ActiveCallModal = ({ onEndCall }: ActiveCallModalProps) => {
	const participant = useSelector(selectParticipant);
	const currentUser = useSelector(selectUserData);
	const callStatus = useSelector(selectCallStatus);
	const callType = useSelector(selectCallType);

	const {
		localVideoRef,
		remoteVideoRef,
		localStream,
		remoteStream,
		upgradeVideoTrack,
		isDummyVideoRef,
	} = usePeerContext();
	const socket = useContext(SocketContext);

	const [prevCallStatus, setPrevCallStatus] = useState(callStatus);

	const [isMicMuted, setIsMicMuted] = useState(false);
	const [isCamMuted, setIsCamMuted] = useState(callType === 'audio');

	const [isRemoteMicMuted, setIsRemoteMicMuted] = useState(false);
	const [isRemoteCamMuted, setIsRemoteCamMuted] = useState(
		callType === 'audio'
	);

	const showLocalAvatar = isCamMuted || !localStream;
	const showRemoteAvatar = isRemoteCamMuted || !remoteStream;

	if (callStatus !== prevCallStatus) {
		setPrevCallStatus(callStatus);

		if (callStatus === 'calling' || callStatus === 'receiving') {
			setIsMicMuted(false);
			setIsRemoteMicMuted(false);
			setIsCamMuted(callType === 'audio');
			setIsRemoteCamMuted(callType === 'audio');
		}
	}

	// Переключение микрофона / камеры
	const toggleMedia = useCallback(
		async (type: 'audio' | 'video') => {
			if (!localStream || !socket || !participant) return;

			// Включение камеры при аудиозвонке
			if (type === 'video' && isDummyVideoRef?.current && upgradeVideoTrack) {
				const newTrack = await upgradeVideoTrack();

				if (!newTrack) return; // Если польщователь отменил запрос доступ на камеру

				setIsCamMuted(false);
				socket.emit('toggleMedia', {
					to: participant._id,
					type: 'video',
					isMuted: false,
				});

				return;
			}

			// Обычное переключение
			const track =
				type === 'audio'
					? localStream.getAudioTracks()[0]
					: localStream.getVideoTracks()[0];

			if (track) {
				// Переключаем состояние трека
				track.enabled = !track.enabled;
				const newMutedState = !track.enabled;

				if (type === 'audio') {
					setIsMicMuted(newMutedState);
				} else {
					setIsCamMuted(newMutedState);
				}

				// Изменяем статус у собеседника
				socket.emit('toggleMedia', {
					to: participant._id,
					type: type,
					isMuted: newMutedState,
				});
			}
		},
		[localStream, socket, participant, upgradeVideoTrack, isDummyVideoRef]
	);

	// Слушаем изменения от собеседника
	useEffect(() => {
		if (!socket) return;

		const handleRemoteMediaToggle = ({
			type,
			isMuted,
		}: {
			type: string;
			isMuted: boolean;
		}) => {
			if (type === 'audio') setIsRemoteMicMuted(isMuted);
			if (type === 'video') setIsRemoteCamMuted(isMuted);
		};

		socket.on('peerMediaToggled', handleRemoteMediaToggle);

		return () => {
			socket.off('peerMediaToggled', handleRemoteMediaToggle);
		};
	}, [socket]);

	if (
		(callStatus !== 'calling' && callStatus !== 'connected') ||
		!participant ||
		!currentUser
	) {
		return null;
	}

	return (
		<Modal onClose={onEndCall}>
			<Window
				title={`активный звонок с ${participant.username}`}
				icon={
					<img
						src={networkModalIcon}
						alt='Иконка в виде соединения двух компьютеров'
					/>
				}
				className={styles.modalWindow}
				bodyClassName={styles.modalWindowBody}>
				<div className={styles.videoGrid}>
					{/* Текущий пользователь */}
					<div className={styles.videoWrapper}>
						{showLocalAvatar && (
							<Avatar
								src={currentUser.avatar}
								name={currentUser.username}
								size='large'
								className={styles.avatarFallback}
							/>
						)}
						<video
							ref={localVideoRef}
							autoPlay
							playsInline
							muted
							className={styles.videoElement}
							style={{ display: isCamMuted ? 'none' : 'block' }}
						/>
						<div className={styles.usernameBadge}>
							<Text as='span' size={30} lowercase>
								{currentUser.username}
							</Text>
							{isMicMuted && (
								<img
									src={mutedSoundIcon}
									className={styles.mutedIcon}
									alt='Микрофон выключен'
								/>
							)}
						</div>
					</div>

					{/* Собеседник */}
					<div className={styles.videoWrapper}>
						{showRemoteAvatar && (
							<Avatar
								src={participant.avatar}
								name={participant.username}
								size='large'
								className={styles.avatarFallback}
							/>
						)}
						<video
							ref={remoteVideoRef}
							autoPlay
							playsInline
							className={styles.videoElement}
							style={{ display: isRemoteCamMuted ? 'none' : 'block' }}
						/>
						<div className={styles.usernameBadge}>
							<Text as='span' size={30} lowercase>
								{participant.username}
							</Text>
							{isRemoteMicMuted && (
								<img
									src={mutedSoundIcon}
									className={styles.mutedIcon}
									alt='Микрофон выключен'
								/>
							)}
						</div>
					</div>
				</div>

				{/* Меню управления */}
				<div className={styles.controlsBar}>
					<Button
						title='Переключение микрофона'
						size='small'
						className={styles.toggleBtn}
						onClick={() => toggleMedia('audio')}>
						<div className={styles.toggleIconWrapper}>
							{isMicMuted && (
								<img
									src={rejectIcon}
									className={styles.offIcon}
									alt='Микрофон выключен'
								/>
							)}
							<img
								src={toggleMic}
								className={styles.mainIcon}
								alt='Переключение микрофона'
							/>
						</div>
					</Button>
					<Button
						title='Переключение камеры'
						size='small'
						className={styles.toggleBtn}
						onClick={() => toggleMedia('video')}>
						<div className={styles.toggleIconWrapper}>
							{isCamMuted && (
								<img
									src={rejectIcon}
									className={styles.offIcon}
									alt='Камера выключена'
								/>
							)}
							<img
								src={toggleCamera}
								className={styles.mainIcon}
								alt='Переключение камеры'
							/>
						</div>
					</Button>
					<Button title='Настройки' size='small'>
						<img src={settingsIcon} alt='Настройки' />
					</Button>
					<Button title='Завершить звонок' size='large' onClick={onEndCall}>
						завершить вызов
					</Button>
				</div>
			</Window>
		</Modal>
	);
};
