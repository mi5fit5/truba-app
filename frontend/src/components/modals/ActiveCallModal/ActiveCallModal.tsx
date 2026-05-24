import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { SocketContext, usePeerContext } from '@context';
import { useDispatch, useSelector } from '@store';
import {
	fetchChatHistory,
	selectCallStatus,
	selectCallType,
	selectChatMessages,
	selectIsChatOpen,
	selectIsLoadingHistory,
	selectIsSearchActive,
	selectParticipant,
	selectRemoteMedia,
	selectUserData,
	setActiveFriendId,
	setChatOpen,
	selectIsScreenSharing,
} from '@slices';

import { MessageList, ChatFooter } from '@components';
import { CallSettingsPopover } from '@modals';
import { Avatar, Button, Modal, Preloader, Text, Window } from '@ui';

import styles from './ActiveCallModal.module.scss';
import {
	mutedSoundIcon,
	networkModalIcon,
	newMessageIcon,
	rejectIcon,
	settingsIcon,
	shareScreenIcon,
	toggleCamera,
	toggleMic,
} from '@icons';
import { initCallSound, callEndSound } from '@audio';
import { playSystemSound } from '@utils/audioUtils';

interface ActiveCallModalProps {
	onEndCall: () => void;
}

export const ActiveCallModal = ({ onEndCall }: ActiveCallModalProps) => {
	const dispatch = useDispatch();
	const participant = useSelector(selectParticipant);
	const currentUser = useSelector(selectUserData);
	const callStatus = useSelector(selectCallStatus);
	const callType = useSelector(selectCallType);
	const isChatOpen = useSelector(selectIsChatOpen);
	const isScreenSharing = useSelector(selectIsScreenSharing);

	const {
		localVideoRef,
		remoteVideoRef,
		remoteAudioRef,
		localStream,
		remoteStream,
		isDummyVideoRef,
		upgradeVideoTrack,
		disableCamera,
		toggleScreenShare,
	} = usePeerContext();
	const socket = useContext(SocketContext);

	// Данные собеседника
	const remoteMedia = useSelector(selectRemoteMedia);
	const isRemoteMicMuted = remoteMedia.isMicMuted;
	const isRemoteCamMuted = remoteMedia.isCamMuted;

	const chatMessages = useSelector(selectChatMessages);
	const isLoadingHistory = useSelector(selectIsLoadingHistory);
	const isSearchActive = useSelector(selectIsSearchActive);

	// Стейты для настроек звонка
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [remoteVolume, setRemoteVolume] = useState(100);

	// Стейт для фокуса участника
	const [focusedParticipant, setFocusedParticipant] = useState<
		'local' | 'remote' | null
	>(null);

	// Стейты для отслеживания предыдущих значений
	const [prevCallStatus, setPrevCallStatus] = useState(callStatus);
	const [prevIsScreenSharing, setPrevIsScreenSharing] =
		useState(isScreenSharing);
	const [prevIsChatOpen, setPrevIsChatOpen] = useState(isChatOpen);

	// Локальные стейты для медиа текущего пользователя
	const [isMicMuted, setIsMicMuted] = useState(false);
	const [isCamMuted, setIsCamMuted] = useState(callType === 'audio');

	// Показывать аватар или камеру
	const showLocalAvatar = (isCamMuted && !isScreenSharing) || !localStream;
	const showRemoteAvatar = isRemoteCamMuted || !remoteStream;

	const prevCallStatusAudioRef = useRef(callStatus);
	const outgoingAudioRef = useRef<HTMLAudioElement | null>(null);

	// Сброс локальных стейтов при новом звонке / завершении
	if (callStatus !== prevCallStatus) {
		setPrevCallStatus(callStatus);
		setFocusedParticipant(null);

		if (callStatus === 'calling' || callStatus === 'receiving') {
			setIsMicMuted(false);
			setIsCamMuted(callType === 'audio');
			setChatOpen(false);
			setRemoteVolume(100);
		}
	}

	if (isScreenSharing !== prevIsScreenSharing) {
		setPrevIsScreenSharing(isScreenSharing);

		if (isScreenSharing) {
			setIsCamMuted(false);
		} else {
			setIsCamMuted(true);
		}
	}

	if (isChatOpen !== prevIsChatOpen) {
		setPrevIsChatOpen(isChatOpen);

		if (isChatOpen) setFocusedParticipant(null);
	}

	// Обработчик открытия чата
	const handleToggleChat = () => {
		if (!isChatOpen && participant) {
			dispatch(setActiveFriendId(participant._id));
			dispatch(fetchChatHistory(participant._id));
		}

		dispatch(setChatOpen(!isChatOpen));
	};

	// Обработчик клика по видео (для фокуса участника)
	const handleVideoClick = (target: 'local' | 'remote') => {
		if (isChatOpen) return;

		setFocusedParticipant((prev) => (prev === target ? null : target));
	};

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

	// Изменение громкости собеседника
	useEffect(() => {
		if (remoteAudioRef.current) {
			remoteAudioRef.current.volume = remoteVolume / 100;
		}
	}, [remoteVolume, remoteAudioRef]);

	// Привязка медиа-потоков к DOM
	useEffect(() => {
		// Видео или голос локального пользователя
		if (localVideoRef.current && localStream) {
			localVideoRef.current.srcObject = localStream;
		}
	}, [localStream, localVideoRef]);

	useEffect(() => {
		// Голос собеседника
		if (remoteAudioRef.current && remoteStream) {
			remoteAudioRef.current.srcObject = remoteStream;
		}

		// Видео собеседника
		if (remoteVideoRef.current && remoteStream) {
			remoteVideoRef.current.srcObject = remoteStream;
		}
	}, [remoteStream, remoteVideoRef, remoteAudioRef]);

	// Переключение микрофона / камеры
	const toggleMedia = useCallback(
		async (type: 'audio' | 'video') => {
			if (!localStream || !socket || !participant) return;

			// Включение камеры при аудиозвонке
			if (type === 'video') {
				// Запрашиваем реальную веб-камеру
				if (isDummyVideoRef?.current && upgradeVideoTrack) {
					const newTrack = await upgradeVideoTrack();
					if (!newTrack) return;

					setIsCamMuted(false);
					socket.emit('toggleMedia', {
						to: participant._id,
						type: 'video',
						isMuted: false,
					});
				} else {
					// Выключаем камеру
					disableCamera();
					setIsCamMuted(true);
					socket.emit('toggleMedia', {
						to: participant._id,
						type: 'video',
						isMuted: true,
					});
				}
				return;
			}

			// Обычное переключение
			const track = localStream.getAudioTracks()[0];

			if (track) {
				// Переключаем состояние трека
				track.enabled = !track.enabled;
				setIsMicMuted(!track.enabled);
				socket.emit('toggleMedia', {
					to: participant._id,
					type: 'audio',
					isMuted: !track.enabled,
				});
			}
		},
		[
			localStream,
			socket,
			participant,
			upgradeVideoTrack,
			disableCamera,
			isDummyVideoRef,
		]
	);

	// Звуковые эффекты звонка
	useEffect(() => {
		// Исходящий звонок
		if (callStatus === 'calling') {
			playSystemSound(initCallSound, true).then((audio) => {
				outgoingAudioRef.current = audio;
			});
		} else {
			if (outgoingAudioRef.current) {
				outgoingAudioRef.current.pause();
				outgoingAudioRef.current.currentTime = 0;
				outgoingAudioRef.current = null;
			}
		}

		// Завершение звонка
		if (
			(prevCallStatusAudioRef.current === 'connected' ||
				prevCallStatusAudioRef.current === 'calling') &&
			callStatus === 'idle'
		) {
			playSystemSound(callEndSound, false);
		}

		prevCallStatusAudioRef.current = callStatus;

		return () => {
			if (outgoingAudioRef.current) {
				outgoingAudioRef.current.pause();
				outgoingAudioRef.current.currentTime = 0;
			}
		};
	}, [callStatus]);

	if (
		(callStatus !== 'calling' && callStatus !== 'connected') ||
		!participant ||
		!currentUser
	) {
		return null;
	}

	return (
		<Modal onClose={onEndCall}>
			<audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
			<Window
				title={`активный звонок с ${participant.username} - тРУба.exe`}
				icon={
					<img
						src={networkModalIcon}
						alt='Иконка в виде соединения двух компьютеров'
					/>
				}
				className={styles.modalWindow}
				bodyClassName={styles.modalWindowBody}>
				{/* Иконка чата (когда чат закрыт) */}
				{!isChatOpen && (
					<Button
						size='small'
						onClick={handleToggleChat}
						className={styles.openChatBtn}
						title='Открыть чат'>
						<img src={newMessageIcon} alt='Иконка чата' />
					</Button>
				)}

				<div
					className={clsx(
						styles.leftColumn,
						isChatOpen && styles.chatOpen,
						focusedParticipant && !isChatOpen && styles.withPadding
					)}>
					<div
						className={clsx(
							styles.videoGrid,
							focusedParticipant && styles.hasFocused
						)}>
						{/* Текущий пользователь (локальное видео) */}
						<div
							className={clsx(
								styles.videoWrapper,
								focusedParticipant === 'local' && styles.focused,
								focusedParticipant === 'remote' && styles.unfocused
							)}
							onClick={() => handleVideoClick('local')}>
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
								className={clsx(
									styles.videoElement,
									isScreenSharing && styles.containVideo
								)}
								style={{
									display: isCamMuted && !isScreenSharing ? 'none' : 'block',
								}}
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

						{/* Собеседник (удаленное видео) */}
						<div
							className={clsx(
								styles.videoWrapper,
								focusedParticipant === 'remote' && styles.focused,
								focusedParticipant === 'local' && styles.unfocused
							)}
							onClick={() => handleVideoClick('remote')}>
							{callStatus === 'calling' && (
								<div className={styles.callingOverlay}>
									<Preloader />
								</div>
							)}

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
								muted
								className={clsx(
									styles.videoElement,
									isScreenSharing && styles.containVideo
								)}
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
					<div className={styles.controlsWrapper}>
						<div className={styles.controlsBar}>
							<Button
								title={isMicMuted ? 'Включить микрофон' : 'Выключить микрофон'}
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
								title={
									isCamMuted ? 'Включить веб-камеру' : 'Выключить веб-камеру'
								}
								size='small'
								className={styles.toggleBtn}
								onClick={() => toggleMedia('video')}
								disabled={isScreenSharing}>
								<div className={styles.toggleIconWrapper}>
									{(isCamMuted || isScreenSharing) && (
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
								title={
									isScreenSharing
										? 'Остановить демонстрацию экрана'
										: 'Демонстрация экрана'
								}
								size='small'
								className={clsx(
									styles.toggleBtn,
									isScreenSharing && styles.activeControl
								)}
								onClick={toggleScreenShare}>
								<img src={shareScreenIcon} alt='Демонстрация экрана' />
							</Button>
							<Button
								id='settings-button'
								title='Настройки'
								size='small'
								onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
								<img src={settingsIcon} alt='Настройки' />
								{/* настройки */}
							</Button>
							<Button title='Завершить звонок' size='huge' onClick={onEndCall}>
								завершить звонок
							</Button>

							{/* Поповер настроек */}
							<CallSettingsPopover
								isOpen={isSettingsOpen}
								onClose={() => setIsSettingsOpen(false)}
								callStatus={callStatus}
								remoteVolume={remoteVolume}
								onRemoteVolumeChange={setRemoteVolume}
								isCamMuted={isCamMuted}
							/>
						</div>
					</div>
				</div>

				{/* Чат */}
				{isChatOpen && (
					<div className={styles.rightColumn}>
						<div className={`${styles.panel} ${styles.chatArea}`}>
							<div className={styles.chatHeader}>
								<Text as='h3' size={30} align='left'>
									ваш чат с {participant.username}:
								</Text>
								<Button
									size='small'
									onClick={handleToggleChat}
									title='Закрыть чат'>
									<img src={newMessageIcon} alt='Иконка чата: закрыть' />
								</Button>
							</div>
							<div className={styles.messageListContainer}>
								<MessageList
									messages={chatMessages}
									currentUserId={currentUser._id}
									currentUsername={currentUser.username}
									friendUsername={participant.username}
									isSearchActive={isSearchActive}
									isLoadingHistory={isLoadingHistory}
								/>
							</div>
						</div>
						<div className={styles.panel}>
							<ChatFooter friendId={participant._id} buttonSize='medium' />
						</div>
					</div>
				)}
			</Window>
		</Modal>
	);
};
