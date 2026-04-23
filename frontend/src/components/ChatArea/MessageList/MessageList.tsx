import { useEffect, useRef } from 'react';

import type { TMessage } from '../../../types';
import { formatMessageDate } from '../../../utils/formatMessageDate';

import { MessageItem } from '../../MessageItem';
import { Text } from '../../ui/Text';

import styles from './MessageList.module.scss';
import { Preloader } from '../../ui/Preloader';

interface MessageListProps {
	messages: TMessage[];
	currentUserId: string;
	currentUsername: string;
	friendUsername: string;
	isSearchActive: boolean;
	isLoadingHistory: boolean;
}

export const MessageList = ({
	messages,
	currentUserId,
	currentUsername,
	friendUsername,
	isSearchActive,
	isLoadingHistory,
}: MessageListProps) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<div className={styles.container}>
			<div className={styles.listWrapper}>
				{isLoadingHistory ? (
					<div className={styles.loaderWrapper}>
						<Preloader />
					</div>
				) : (
					<div className={styles.contentWrapper}>
						<Text as='p' size={30} lowercase>
							{isSearchActive ? 'результаты поиска:' : 'начало вашего общения:'}
						</Text>
						{messages.length === 0 ? (
							<Text
								as='p'
								size={18}
								lowercase
								align='left'
								className={styles.emptyState}>
								{isSearchActive
									? 'по вашему запросу ничего не найдено...'
									: 'напишите первое сообщение!'}
							</Text>
						) : (
							<div className={styles.messagesGroup}>
								{messages.map((msg) => {
									const isMe = msg.sender === currentUserId;

									const type = isMe ? 'me' : 'friend';
									const senderName = isMe ? currentUsername : friendUsername;

									return (
										<MessageItem
											key={msg._id}
											type={type}
											timestamp={formatMessageDate(msg.createdAt)}
											senderName={senderName}
											text={msg.text}
										/>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>

			<div ref={messagesEndRef} />
		</div>
	);
};
