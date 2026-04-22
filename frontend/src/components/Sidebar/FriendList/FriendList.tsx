import { useDispatch, useSelector } from '../../../services/store';
import { selectActiveFriendId, setActiveFriendId } from '../../../services/slices/chatSlice';

import { Text } from '../../ui/Text';
import { FriendItem } from '../../FriendItem';

import type { TFriend } from '../../../types';

import styles from './FriendList.module.scss';

interface FriendListProps {
	friends: TFriend[];
}

export const FriendList = ({ friends }: FriendListProps) => {
  const dispatch = useDispatch();
  const activeFriendId = useSelector(selectActiveFriendId);

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
              isSelected={activeFriendId === friend._id}
              onClick={() => dispatch(setActiveFriendId(friend._id))}
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
