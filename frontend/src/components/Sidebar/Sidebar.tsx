import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '@store';

import {
	fetchFriendRequests,
	fetchFriends,
	selectFriends,
	selectRequests,
} from '@slices';

import {
	SearchBar,
	FriendList,
	AddFriend,
	RequestList,
	ProfileSection,
} from '@components';

import styles from './Sidebar.module.scss';

export const Sidebar = () => {
	const dispatch = useDispatch();
	const [searchQuery, setSearchQuery] = useState('');

	const friends = useSelector(selectFriends);
	const requests = useSelector(selectRequests);

	const filteredFriends = friends.filter((friend) => {
		return friend.username.toLowerCase().includes(searchQuery.toLowerCase());
	});

	useEffect(() => {
		dispatch(fetchFriends());
		dispatch(fetchFriendRequests());
	}, [dispatch]);

	return (
		<div className={styles.sidebar}>
			<div className={styles.panel}>
				<SearchBar onSearch={setSearchQuery} />
				<div className={styles.innerList}>
					<FriendList friends={filteredFriends} />
				</div>
			</div>
			<div className={styles.panel}>
				<AddFriend />
				<div className={styles.innerList}>
					<RequestList requests={requests} />
				</div>
			</div>
			<ProfileSection />
		</div>
	);
};
