import { useEffect } from 'react';

import { useDispatch, useSelector } from '@store';
import {
	fetchChatHistory,
	selectActiveFriendId,
	selectChatMessages,
	selectIsLoadingHistory,
	selectIsSearchActive,
	selectFriends,
	selectUserData,
} from '@slices';

import { ChatHeader, MessageList, MessageInput } from '@components';
import { Text } from '@ui';

import styles from './ChatArea.module.scss';

export const ChatArea = () => {
	const dispatch = useDispatch();

	const activeFriendId = useSelector(selectActiveFriendId);
	const friends = useSelector(selectFriends);
	const activeFriend = friends.find((friend) => friend._id === activeFriendId);

	const messages = useSelector(selectChatMessages);
	const isLoadingHistory = useSelector(selectIsLoadingHistory);
	const isSearchActive = useSelector(selectIsSearchActive);

	const currentUser = useSelector(selectUserData);

	useEffect(() => {
		if (activeFriendId) {
			dispatch(fetchChatHistory(activeFriendId));
		}
	}, [activeFriendId, dispatch]);

	if (!activeFriend) {
		return (
			<div className={styles.chatArea}>
				<div className={`${styles.panel} ${styles.emptyText}`}>
					<Text as='p' size={40} align='center'>
						выберите друга <br /> для общения
					</Text>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.chatArea}>
			<div className={styles.panel}>
				<ChatHeader friend={activeFriend} />
				<div className={styles.messageListContainer}>
					<MessageList
						messages={messages}
						currentUserId={currentUser?._id || ''}
						currentUsername={currentUser?.username || 'me'}
						friendUsername={activeFriend.username}
						isSearchActive={isSearchActive}
						isLoadingHistory={isLoadingHistory}
					/>
				</div>
			</div>
			<div className={styles.panel}>
				<MessageInput friendId={activeFriend._id} />
			</div>
		</div>
	);
};
