import { Text } from '../../ui/Text';
import { FriendItem } from '../../FriendItem';

import type { TFriend } from '../../../types';

import styles from './FriendList.module.scss';

interface FriendListProps {
	friends: TFriend[];
}

export const FriendList = ({ friends }: FriendListProps) => {
	return (
		<div className={styles.container}>
			<Text as='p' size={30} lowercase>
				Друзья:
			</Text>
			<div className={styles.listWrapper}>
				{friends.length > 0 ? (
					friends.map((friend) => (
						<FriendItem
							key={friend._id}
							username={friend.username}
							avatar={friend.avatar}
							isOnline={true} // TODO: Доделать статус
						/>
					))
				) : (
					<Text as='p' size={14} lowercase align='left'>
						Пустовато тут однако...
					</Text>
				)}
			</div>
		</div>
	);
};
