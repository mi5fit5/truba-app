import { clsx } from 'clsx';

import { Avatar, Text } from '@ui';

import styles from './MessageItem.module.scss';
import {
	userMessageIcon,
	friendMessageIcon,
	systemMessageIcon,
	acceptIcon,
} from '@icons';

interface MessageItemProps {
	type: 'me' | 'friend' | 'system';
	messageCategory?: 'text' | 'system' | 'invite';
	gameData?: {
		gameName: string;
		appId: string;
		lobbyId: string | null;
		gameAvatarUrl?: string | null;
	};
	timestamp: string;
	senderName: string;
	text: string;
}

export const MessageItem = ({
	type,
	messageCategory = 'text',
	gameData,
	timestamp,
	senderName,
	text,
}: MessageItemProps) => {
	const getIcon = () => {
		switch (type) {
			case 'me':
				return userMessageIcon;
			case 'friend':
				return friendMessageIcon;
			case 'system':
				return systemMessageIcon;
		}
	};

	// Обработчик присоединения к игре
	const handleJoinGame = () => {
		if (!gameData?.appId) return;

		if (gameData.lobbyId) {
			window.location.href = `steam://joinlobby/${gameData.appId}/${gameData.lobbyId}`;
		} else {
			window.location.href = `steam://run/${gameData.appId}`;
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.messageHeader}>
				<img
					src={getIcon()}
					alt={`Иконка сообщения: ${type}`}
					className={styles.icon}
				/>
				<div className={styles.content}>
					<span className={clsx(styles.meta, styles[type])}>
						{/* Вид: [дата] <никнейм>: */}
						&#91;{timestamp}&#93; &lt;{senderName}&gt;&#58;
					</span>

					{messageCategory !== 'invite' && (
						<span className={styles.text}> {text}</span>
					)}
				</div>
			</div>

			{messageCategory === 'invite' && gameData && (
				<div className={styles.inviteCard}>
					<div className={styles.inviteInfoWrapper}>
						<Avatar
							src={gameData.gameAvatarUrl || undefined}
							name={gameData.gameName}
							size='medium'
						/>
						<div className={styles.inviteText}>
							<Text as='p' size={22} align='left' className={styles.gameTitle}>
								{gameData.gameName}
							</Text>
							<Text as='span' size={12} lowercase align='left'>
								приглашение в игру
							</Text>
						</div>
					</div>
					<div className={styles.inviteActions}>
						<button
							className={styles.acceptButton}
							title='Присоединиться к игре'
							onClick={handleJoinGame}>
							<img src={acceptIcon} alt='Принять: галочка' />
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
