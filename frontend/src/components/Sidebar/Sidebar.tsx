import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../../services/store';

import {
	fetchFriendRequests,
	fetchFriends,
	selectFriends,
	selectRequests,
} from '../../services/slices/friendsSlice';

import { SearchBar } from './SearchBar/SearchBar';
import { FriendList } from './FriendList/FriendList';
import { AddFriend } from './AddFriend/AddFriend';
import { RequestList } from './RequestList';
import { Separator } from '../ui/Separator';

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
			<SearchBar onSearch={setSearchQuery} />
			<FriendList friends={filteredFriends} />
			<Separator />
			<RequestList requests={requests} />
			<AddFriend />
		</div>
	);
};
