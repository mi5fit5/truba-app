import React, { useState } from 'react';
import type { TFriend } from '@types';
import { useDispatch } from '@store';
import { fetchChatHistory, fetchSearchedMessages } from '@slices';

import { Avatar, Text, Button, ActionInput } from '@ui';

import styles from './ChatHeader.module.scss';
import { phoneCallIcon, videoCallIcon, findMessageIcon } from '@icons';

interface ChatHeaderProps {
	friend: TFriend;
}

export const ChatHeader = ({ friend }: ChatHeaderProps) => {
	const dispatch = useDispatch();
	const [searchQuery, setSearchQuery] = useState('');
	const isOnline = true;

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);

		if (e.target.value === '') {
			dispatch(fetchChatHistory(friend._id));
		}
	};

	const handleSearchSubmit = () => {
		if (searchQuery.trim() !== '') {
			dispatch(
				fetchSearchedMessages({ friendId: friend._id, text: searchQuery })
			);
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.friendInfo}>
				<Avatar src={friend.avatar || ''} name={friend.username} size='large' />
				<div className={styles.textWrapper}>
					<Text as='p' size={22} align='left' className={styles.username}>
						{friend.username}
					</Text>
					<div className={styles.statusContainer}>
						<div
							className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}></div>
						<Text as='p' size={12} align='left'>
							{isOnline ? 'онлайн' : 'офлайн'}
						</Text>
					</div>
				</div>
			</div>
			<div className={styles.chatTools}>
				<div className={styles.callButtons}>
					<Button size='small' title='Голосовой звонок'>
						<img src={phoneCallIcon} alt='Иконка: голосовой звонок' />
					</Button>
					<Button size='small' title='Видеозвонок'>
						<img src={videoCallIcon} alt='Иконка: видеозвонок' />
					</Button>
				</div>
				<ActionInput
					className={styles.searchBlock}
					value={searchQuery}
					onChange={handleSearchChange}
					placeholder='найти...'
					iconSrc={findMessageIcon}
					iconAlt='Иконка: поиск по чату'
					buttonTitle='Поиск сообщений по истории чата'
					buttonSize='small'
					onAction={handleSearchSubmit}
				/>
			</div>
		</div>
	);
};
