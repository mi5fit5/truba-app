import { useCallback, useContext, useEffect, useState } from 'react';

import { SocketContext, usePeerContext } from '@context';
import { useSelector } from '@store';
import {
	selectCallStatus,
	selectCallType,
	selectParticipant,
	selectRemoteMedia,
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
import { CallSettingsPopover } from '../SettingsPopover';

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
		switchDevice,
		isDummyVideoRef,
		availableMics,
		availableCams,
		selectedMic,
		selectedCam,
	} = usePeerContext();
	const socket = useContext(SocketContext);

	// Данные собеседника
	const remoteMedia = useSelector(selectRemoteMedia);
	const isRemoteMicMuted = remoteMedia.isMicMuted;
	const isRemoteCamMuted = remoteMedia.isCamMuted;

	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	// Локальные стейты для медиа текущего пользователя
	const [prevCallStatus, setPrevCallStatus] = useState(callStatus);
	const [isMicMuted, setIsMicMuted] = useState(false);
	const [isCamMuted, setIsCamMuted] = useState(callType === 'audio');

	// Показывать аватар или камеру
	const showLocalAvatar = isCamMuted || !localStream;
	const showRemoteAvatar = isRemoteCamMuted || !remoteStream;

	// Сброс локальных стейтов при новом звонке
	if (callStatus !== prevCallStatus) {
		setPrevCallStatus(callStatus);

		if (callStatus === 'calling' || callStatus === 'receiving') {
			setIsMicMuted(false);
			setIsCamMuted(callType === 'audio');
		}
	}

	// Все переключения аудио/видео применяются к собеседнику при его принятии звонка
	useEffect(() => {
		if (callStatus === 'connected' && socket && participant) {
			socket.emit('toggleMedia', {
				to: participant._id,
				type: 'video',
				isMuted: isCamMuted,
			});

			socket.emit('toggleMedia', {
				to: participant._id,
				type: 'audio',
				isMuted: isMicMuted,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [callStatus]);

	// Переключение микрофона / камеры
	const toggleMedia = useCallback(
		async (type: 'audio' | 'video') => {
			if (!localStream || !socket || !participant) return;

			// Включение камеры при аудиозвонке
			if (type === 'video' && isDummyVideoRef?.current && upgradeVideoTrack) {
				const newTrack = await upgradeVideoTrack();

				if (!newTrack) return; // Если пользователь отменил запрос доступ на камеру

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
					<Button
						id='settings-button'
						title='Настройки'
						size='small'
						onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
						<img src={settingsIcon} alt='Настройки' />
					</Button>
					<Button title='Завершить звонок' size='large' onClick={onEndCall}>
						завершить вызов
					</Button>

					<CallSettingsPopover
						isOpen={isSettingsOpen}
						onClose={() => setIsSettingsOpen(false)}
						onSwitchDevice={switchDevice}
						callStatus={callStatus}
						availableMics={availableMics}
						availableCams={availableCams}
						selectedMic={selectedMic}
						selectedCam={selectedCam}
					/>
				</div>
			</Window>
		</Modal>
	);
};
