import type { TFriend } from '@types';
import { useDispatch, useSelector } from '@store';
import {
	selectActiveFriendId,
	setActiveFriendId,
	selectOnlineUsers,
	selectUnreadSenders,
} from '@slices';

import { FriendItem } from '@items';
import { Text } from '@ui';

import styles from './FriendList.module.scss';

interface FriendListProps {
	friends: TFriend[];
}

export const FriendList = ({ friends }: FriendListProps) => {
	const dispatch = useDispatch();
	const activeFriendId = useSelector(selectActiveFriendId);
	const onlineUsers = useSelector(selectOnlineUsers);
	const unreadSenders = useSelector(selectUnreadSenders);

	return (
		<div className={styles.container}>
			<Text as='p' size={30} lowercase>
				Друзья:
			</Text>
			<div className={styles.listWrapper}>
				{friends.length > 0 ? (
					friends.map((friend) => {
						const isFriendOnline = onlineUsers.includes(friend._id);
						const hasUnreadMessages = unreadSenders.includes(friend._id);

						return (
							<FriendItem
								key={friend._id}
								username={friend.username}
								avatar={friend.avatar}
								isOnline={isFriendOnline}
								isSelected={activeFriendId === friend._id}
								hasUnread={hasUnreadMessages}
								onClick={() => dispatch(setActiveFriendId(friend._id))}
							/>
						);
					})
				) : (
					<Text as='p' size={14} lowercase align='left'>
						Пустовато тут однако...
					</Text>
				)}
			</div>
		</div>
	);
};
