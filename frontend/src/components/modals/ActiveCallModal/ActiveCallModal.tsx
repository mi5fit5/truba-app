import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { usePeerContext } from '@context';
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
import { useMediaQuery } from '@hooks';

import { MessageList, ChatFooter } from '@components';
import { CallSettingsPopover } from '@modals';
import { Avatar, Button, Modal, Preloader, Text, Window } from '@ui';

import styles from './ActiveCallModal.module.scss';
import {
	mutedSoundIcon,
	networkModalIcon,
	newMessageIcon,
	phoneCallIcon,
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
	const chatMessages = useSelector(selectChatMessages);
	const isLoadingHistory = useSelector(selectIsLoadingHistory);
	const isSearchActive = useSelector(selectIsSearchActive);

	const {
		localVideoRef,
		remoteVideoRef,
		remoteAudioRef,
		localStream,
		remoteStream,
		remoteStreamRevision,
		toggleScreenShare,
		toggleLocalAudio,
		toggleLocalVideo,
		isScreenShareSupported,
	} = usePeerContext();

	const isMobile = useMediaQuery('(max-width: 1023px)');
	const isHugeButton = useMediaQuery('(max-width: 430px)');

	// Стейты для настроек звонка
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [remoteVolume, setRemoteVolume] = useState(100);

	const [rawFocusedParticipant, setFocusedParticipant] = useState<
		'local' | 'remote' | null
	>(null);
	const focusedParticipant = isMobile ? null : rawFocusedParticipant;

	// Данные собеседника
	const remoteMedia = useSelector(selectRemoteMedia);

	// Стейт для отслеживания предыдущего статуса
	const [prevCallStatus, setPrevCallStatus] = useState(callStatus);

	// Стейты локального юзера
	const [isMicMuted, setIsMicMuted] = useState(false);
	const [isCamMuted, setIsCamMuted] = useState(callType === 'audio');

	const outgoingAudioRef = useRef<HTMLAudioElement | null>(null);
	const prevCallStatusAudioRef = useRef<string | null>(null);
	const prevCamMutedRef = useRef(isCamMuted);

	// Синхронизация состояния камеры
	if (callStatus !== prevCallStatus) {
		setPrevCallStatus(callStatus);

		if (callStatus === 'calling' || callStatus === 'receiving') {
			setIsMicMuted(false);
			setIsCamMuted(callType === 'audio');
		}
	}

	// Привязка локального видео
	useEffect(() => {
		const videoNode = localVideoRef.current;

		if (videoNode && localStream) {
			if (videoNode.srcObject !== localStream) {
				videoNode.srcObject = localStream;
				videoNode.play().catch((err) => {
					if (err.name !== 'AbortError')
						console.warn('Ошибка локального видео', err);
				});
			}
		}
	}, [localStream, localVideoRef, callStatus]);

	// Привязка удаленного видео и аудио
	useEffect(() => {
		const videoNode = remoteVideoRef.current;
		const audioNode = remoteAudioRef.current;

		if (videoNode && remoteStream) {
			if (videoNode.srcObject !== remoteStream) {
				videoNode.srcObject = remoteStream;
				videoNode.play().catch((err) => {
					if (err.name !== 'AbortError')
						console.warn('Ошибка удаленного видео:', err);
				});
			}
		}

		if (audioNode && remoteStream) {
			if (audioNode.srcObject !== remoteStream) {
				audioNode.srcObject = remoteStream;
				audioNode.play().catch((err) => {
					if (err.name !== 'AbortError')
						console.warn('Ошибка удаленного аудио:', err);
				});
			}
		}
	}, [remoteStream, remoteVideoRef, remoteAudioRef]);

	// Громкость собеседника
	useEffect(() => {
		if (remoteAudioRef.current) {
			remoteAudioRef.current.volume = remoteVolume / 100;
		}
	}, [remoteVolume, remoteAudioRef]);

	// Звуковое сопровождение
	useEffect(() => {
		if (callStatus === 'calling') {
			playSystemSound(initCallSound, true).then((audio) => {
				outgoingAudioRef.current = audio;
			});
		} else if (outgoingAudioRef.current) {
			outgoingAudioRef.current.pause();
			outgoingAudioRef.current.currentTime = 0;
			outgoingAudioRef.current = null;
		}

		if (callStatus === 'idle') {
			if (
				prevCallStatusAudioRef.current === 'connected' ||
				prevCallStatusAudioRef.current === 'calling'
			) {
				playSystemSound(callEndSound, false);
			}
		}

		prevCallStatusAudioRef.current = callStatus;
	}, [callStatus]);

	const handleToggleVideo = async () => {
		const isVideoNowOn = await toggleLocalVideo();
		setIsCamMuted(!isVideoNowOn);
	};

	const handleToggleAudio = () => {
		const isAudioNowOn = toggleLocalAudio();
		setIsMicMuted(!isAudioNowOn);
	};

	const handleToggleScreenShare = async () => {
		const isSharingNow = await toggleScreenShare();

		if (isSharingNow) {
			prevCamMutedRef.current = isCamMuted;
			setIsCamMuted(true);
		} else {
			setIsCamMuted(prevCamMutedRef.current);
		}
	};

	const handleToggleChat = () => {
		if (!isChatOpen && participant) {
			dispatch(setActiveFriendId(participant._id));
			dispatch(fetchChatHistory(participant._id));

			setFocusedParticipant(null);
		}
		dispatch(setChatOpen(!isChatOpen));
	};

	if (
		(callStatus !== 'calling' && callStatus !== 'connected') ||
		!participant ||
		!currentUser
	) {
		return null;
	}

	const isLocalVideoActive =
		(!isCamMuted || isScreenSharing) && !!localStream?.getVideoTracks().length;
	const isRemoteVideoActive =
		!remoteMedia.isCamMuted &&
		!!remoteStream
			?.getVideoTracks()
			.some(
				(track) => track.enabled && !track.muted && track.readyState === 'live'
			);

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
						!isChatOpen && styles.withPadding
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
							onClick={() =>
								!isMobile &&
								!isChatOpen &&
								setFocusedParticipant((p) => (p === 'local' ? null : 'local'))
							}>
							{!isLocalVideoActive && (
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
									opacity: isLocalVideoActive ? 1 : 0,
									position: 'absolute',
									pointerEvents: isLocalVideoActive ? 'auto' : 'none',
								}}
							/>
							<div className={styles.usernameBadge}>
								<Text as='span' size={30} lowercase>
									{currentUser.username}
								</Text>
								<img
									src={mutedSoundIcon}
									className={styles.mutedIcon}
									alt='muted'
									style={{
										opacity: isMicMuted ? 1 : 0,
										transition: 'opacity 0.2s',
									}}
								/>
							</div>
						</div>

						{/* Собеседник (удаленное видео) */}
						<div
							className={clsx(
								styles.videoWrapper,
								focusedParticipant === 'remote' && styles.focused,
								focusedParticipant === 'local' && styles.unfocused
							)}
							onClick={() =>
								!isMobile &&
								!isChatOpen &&
								setFocusedParticipant((p) => (p === 'remote' ? null : 'remote'))
							}>
							{callStatus === 'calling' && (
								<div className={styles.callingOverlay}>
									<Preloader />
								</div>
							)}
							{!isRemoteVideoActive && (
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
								className={styles.videoElement}
								style={{
									opacity: isRemoteVideoActive ? 1 : 0,
									position: 'absolute',
									pointerEvents: isRemoteVideoActive ? 'auto' : 'none',
								}}
							/>
							<div className={styles.usernameBadge}>
								<Text as='span' size={30} lowercase>
									{participant.username}
								</Text>
								<img
									src={mutedSoundIcon}
									className={styles.mutedIcon}
									alt='muted'
									style={{
										opacity: remoteMedia.isMicMuted ? 1 : 0,
										transition: 'opacity 0.2s',
									}}
								/>
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
								onClick={handleToggleAudio}>
								<div className={styles.toggleIconWrapper}>
									<img
										src={rejectIcon}
										className={styles.offIcon}
										alt='Микрофон выключен'
										style={{
											opacity: isMicMuted ? 1 : 0,
											transition: 'opacity 0.2s',
										}}
									/>
									<img
										src={toggleMic}
										className={styles.mainIcon}
										alt='Переключение микрофона'
									/>
								</div>
							</Button>
							<Button
								title={
									isCamMuted || isScreenSharing
										? 'Включить веб-камеру'
										: 'Выключить веб-камеру'
								}
								size='small'
								className={styles.toggleBtn}
								onClick={handleToggleVideo}
								disabled={isScreenSharing}>
								<div className={styles.toggleIconWrapper}>
									<img
										src={rejectIcon}
										className={styles.offIcon}
										alt='Камера выключена'
										style={{
											opacity: isCamMuted || isScreenSharing ? 1 : 0,
											transition: 'opacity 0.2s',
										}}
									/>
									<img
										src={toggleCamera}
										className={styles.mainIcon}
										alt='Переключение камеры'
									/>
								</div>
							</Button>
							{isScreenShareSupported && (
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
									onClick={handleToggleScreenShare}>
									<img src={shareScreenIcon} alt='Демонстрация экрана' />
								</Button>
							)}
							<Button
								id='settings-button'
								title='Настройки'
								size='small'
								onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
								<img src={settingsIcon} alt='Настройки' />
							</Button>
							<Button
								title='Завершить звонок'
								variant='red'
								size={isHugeButton ? 'small' : 'huge'}
								onClick={onEndCall}>
								{isHugeButton ? (
									<img src={phoneCallIcon} alt='Завершить звонок' />
								) : (
									'завершить звонок'
								)}
							</Button>
						</div>

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
