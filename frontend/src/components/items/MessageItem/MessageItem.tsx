import { clsx } from 'clsx';

import styles from './MessageItem.module.scss';
import { userMessageIcon, friendMessageIcon, systemMessageIcon } from '@icons';

interface MessageItemProps {
	type: 'me' | 'friend' | 'system';
	timestamp: string;
	senderName: string;
	text: string;
}

export const MessageItem = ({
	type,
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

	return (
		<div className={styles.container}>
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
				<span className={styles.text}> {text}</span>
			</div>
		</div>
	);
};
