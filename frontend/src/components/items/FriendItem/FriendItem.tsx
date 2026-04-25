import { clsx } from 'clsx';

import { Avatar, Text } from '@ui';

import styles from './FriendItem.module.scss';
import { newMessageIcon } from '@icons';

interface FriendItemProps {
	username: string;
	avatar: string;
	isOnline: boolean;
	isSelected?: boolean;
	hasUnread?: boolean;
	onClick?: () => void;
}

export const FriendItem = ({
	username,
	avatar,
	isOnline,
	isSelected,
	hasUnread,
	onClick,
}: FriendItemProps) => {
	return (
		<div
			className={clsx(styles.container, isSelected && styles.selected)}
			onClick={onClick}
			tabIndex={0}>
			<Avatar src={avatar} name={username} size='medium' />
			<div className={styles.userInfo}>
				<Text as='p' size={22} align='left'>
					{username}
				</Text>
				<div className={styles.statusWrapper}>
					<div
						className={clsx(
							styles.statusIndicator,
							isOnline ? styles.online : styles.offline
						)}
					/>
					<Text as='span' size={12} lowercase align='left'>
						{isOnline ? 'онлайн' : 'офлайн'}
					</Text>
				</div>
			</div>
			{hasUnread && (
				<div className={styles.unreadIcon}>
					<img
						src={newMessageIcon}
						alt='Уведомление о новом сообщении: газета с конвертом'
					/>
				</div>
			)}
		</div>
	);
};
