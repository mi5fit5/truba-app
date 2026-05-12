import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from '@store';
import { selectCallStatus, selectCallType, selectParticipant } from '@slices';

import { Modal, Window, Text, Avatar, Button } from '@ui';

import styles from './IncomingCallModal.module.scss';
import { networkModalIcon, acceptIcon, rejectIcon } from '@icons';
import { declineCallSound, incomingCallSound } from '@audio';

interface IncomingCallModalProps {
	onAccept: () => void;
	onReject: () => void;
}

export const IncomingCallModal = ({
	onAccept,
	onReject,
}: IncomingCallModalProps) => {
	const status = useSelector(selectCallStatus);
	const participant = useSelector(selectParticipant);
	const callType = useSelector(selectCallType);

	const audioRef = useRef<HTMLAudioElement | null>(null);

	const handleAccept = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}

		onAccept();
	}, [onAccept]);

	const handleReject = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}

		const rejectAudio = new Audio(declineCallSound);
		rejectAudio.volume = 0.4;
		rejectAudio.play().catch((err: unknown) => {
			console.warn('Auto-play заблокирован:', err);
		});

		onReject();
	}, [onReject]);

	useEffect(() => {
		if (status === 'receiving') {
			audioRef.current = new Audio(incomingCallSound);
			audioRef.current.volume = 0.4;
			audioRef.current.loop = true;
			audioRef.current.play().catch((err: unknown) => {
				console.warn('Auto-play заблокирован:', err);
			});

			const handleEsc = (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					handleReject();
				}
			};
			document.addEventListener('keydown', handleEsc);

			return () => {
				document.removeEventListener('keydown', handleEsc);

				if (audioRef.current) {
					audioRef.current.pause();
					audioRef.current.currentTime = 0;
				}
			};
		}
	}, [status, handleReject]);

	if (status !== 'receiving' || !participant) return null;

	return (
		<Modal onClose={handleReject}>
			<Window
				title='тРУба.exe'
				icon={
					<img
						src={networkModalIcon}
						alt='Иконка в виде соединения двух компьютеров'
					/>
				}
				className={styles.modalWindow}
				bodyClassName={styles.modalWindowBody}>
				<div className={styles.participantWrapper}>
					<div className={styles.participantInfo}>
						<Text
							as='h2'
							size={30}
							align='center'
							className={styles.participantUsername}>
							{participant.username}
						</Text>
						<div className={styles.captionBox}>
							<Text as='p' size={18} align='center' lowercase>
								звонит вам{' '}
								<span className={styles.highlightText}>
									({callType === 'video' ? 'видео' : 'аудио'})
								</span>
							</Text>
						</div>
					</div>
					<Avatar
						src={participant.avatar}
						name={participant.username}
						size='large'
						className={styles.avatar}
					/>
				</div>
				<div className={styles.modalActions}>
					<Button
						title='Принять входящий звонок'
						size='medium'
						onClick={handleAccept}
						className={styles.btnBody}>
						<img src={acceptIcon} alt='Принять входящий звонок: галочка' />
						<Text as='span' size={22} lowercase align='left'>
							принять
						</Text>
					</Button>
					<Button
						title='Отклонить входящий звонок'
						size='medium'
						onClick={handleReject}
						className={styles.btnBody}>
						<img src={rejectIcon} alt='Отклонить входящий звонок: крестик' />
						<Text as='span' size={22} lowercase align='left'>
							отклонить
						</Text>
					</Button>
				</div>
			</Window>
		</Modal>
	);
};
