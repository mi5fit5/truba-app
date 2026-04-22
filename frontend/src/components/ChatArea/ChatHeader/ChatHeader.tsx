import React, { useState } from 'react';

import { Avatar } from '../../ui/Avatar';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { ActionInput } from '../../ui/ActionInput';
import type { TFriend } from '../../../types';

import styles from './ChatHeader.module.scss';
import phoneIcon from '../../../assets/icons/phone-call_icon.png';
import videoIcon from '../../../assets/icons/video-call_icon.png';
import searchIcon from '../../../assets/icons/find-message_icon.png';

interface ChatHeaderProps {
  friend: TFriend;
}

export const ChatHeader = ({ friend }: ChatHeaderProps) => {
	const [searchQuery, setSearchQuery] = useState('');
	const isOnline = true;

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const handleSearchSubmit = () => {
		console.log('Ищем в чате:', searchQuery);
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
						<img src={phoneIcon} alt='Иконка: голосовой звонок' />
					</Button>
					<Button size='small' title='Видеозвонок'>
						<img src={videoIcon} alt='Иконка: видеозвонок' />
					</Button>
				</div>
				<ActionInput
					className={styles.searchBlock}
					value={searchQuery}
					onChange={handleSearchChange}
					placeholder='найти...'
					iconSrc={searchIcon}
					iconAlt='Иконка: поиск по чату'
          buttonTitle='Поиск сообщений по истории чата'
          buttonSize='small'
					onAction={handleSearchSubmit}
				/>
			</div>
		</div>
	);
};
