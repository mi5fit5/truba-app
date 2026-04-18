import { clsx } from 'clsx';

import { Avatar } from '../ui/Avatar';
import { Text } from '../ui/Text';

import styles from './FriendItem.module.scss';

interface FriendItemProps {
	username: string;
	avatar: string;
	isOnline: boolean;
	isSelected?: boolean;
	onClick?: () => void;
}

export const FriendItem = ({
	username,
	avatar,
	isOnline,
	isSelected,
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
					<Text as='span' size={14} lowercase align='left'>
						{isOnline ? 'онлайн' : 'офлайн'}
					</Text>
				</div>
			</div>
		</div>
	);
};
