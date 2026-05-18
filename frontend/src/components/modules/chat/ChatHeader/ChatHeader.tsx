import React, { useState } from 'react';
import type { TCallType, TFriend, TPopoverUserData } from '@types';
import { useDispatch, useSelector } from '@store';
import {
	fetchChatHistory,
	fetchSearchedMessages,
	initiateCall,
	removeFriend,
	selectOnlineUsers,
} from '@slices';
import { usePeerContext } from '@context';

import { Avatar, Text, Button, ActionInput } from '@ui';

import styles from './ChatHeader.module.scss';
import { phoneCallIcon, videoCallIcon, findMessageIcon } from '@icons';
import { UserPopover } from '@modals';

interface ChatHeaderProps {
	friend: TFriend;
}

export const ChatHeader = ({ friend }: ChatHeaderProps) => {
	const dispatch = useDispatch();
	const onlineUsers = useSelector(selectOnlineUsers);
	const { callToFriend } = usePeerContext();

	const [searchQuery, setSearchQuery] = useState('');
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const isOnline = onlineUsers.includes(friend._id);

	const popoverData: TPopoverUserData = {
		_id: friend._id,
		username: friend.username,
		avatar: friend.avatar,
		bio: friend.bio,
		isOnline: isOnline,
		currentGame: undefined,
	};

	// Обработка изменений инпута для поиска сообщений
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);

		if (e.target.value === '') {
			dispatch(fetchChatHistory(friend._id));
		}
	};

	// Обработка сабмита поиска сообщений
	const handleSearchSubmit = () => {
		if (searchQuery.trim() !== '') {
			dispatch(
				fetchSearchedMessages({ friendId: friend._id, text: searchQuery })
			);
		}
	};

	// Данные друга для звонка
	const participantData = {
		_id: friend._id,
		username: friend.username,
		avatar: friend.avatar,
	};

	// Обработка звонка
	const handleCall = (type: TCallType) => {
		dispatch(initiateCall({ participant: participantData, type }));
		callToFriend(friend._id, type);
	};

	// Удаление из друзей
	const handleRemoveFriend = () => {
		dispatch(removeFriend(friend._id));
		setIsPopoverOpen(false);
	};

	return (
		<div className={styles.container}>
			<div
				className={styles.friendInfoWrapper}
				onClick={(e) => {
					e.stopPropagation();
					setIsPopoverOpen(!isPopoverOpen);
				}}
				onMouseDown={(e) => e.stopPropagation()}>
				<div className={styles.friendInfo} title='Посмотреть профиль'>
					<Avatar
						src={friend.avatar || ''}
						name={friend.username}
						size='medium'
					/>
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

				<div
					className={styles.popoverCenterBottom}
					onClick={(e) => e.stopPropagation()}>
					<UserPopover
						isOpen={isPopoverOpen}
						user={popoverData}
						isSelf={false}
						onClose={() => setIsPopoverOpen(false)}>
						<Button
							title='Удалить из друзей'
							style={{ flex: '1', backgroundColor: '#ffcccc' }}
							onClick={handleRemoveFriend}>
							удалить из друзей
						</Button>
					</UserPopover>
				</div>
			</div>

			<div className={styles.chatTools}>
				<div className={styles.callButtons}>
					<Button
						size='small'
						title='Голосовой звонок'
						onClick={() => handleCall('audio')}>
						<img src={phoneCallIcon} alt='Иконка: голосовой звонок' />
					</Button>
					<Button
						size='small'
						title='Видеозвонок'
						onClick={() => handleCall('video')}>
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
