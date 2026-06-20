import { useContext } from 'react';

import { SocketContext } from '@context';
import { useSelector } from '@store';
import { selectUserData, selectOnlineUsers } from '@slices';
import { useMediaQuery } from '@hooks';

import { MessageInput } from '@components';
import { Button, Text } from '@ui';

import styles from './ChatFooter.module.scss';

interface ChatFooterProps {
	friendId: string;
	buttonSize?: 'small' | 'medium' | 'large';
}

export const ChatFooter = ({ friendId, buttonSize }: ChatFooterProps) => {
	const socket = useContext(SocketContext);
	const isMobile = useMediaQuery('(max-width: 768px)');

	const currentUser = useSelector(selectUserData);
	const onlineUsers = useSelector(selectOnlineUsers);

	const handleInviteClick = () => {
		if (
			// Выходим из обработчика при условии, что нет сокета, пользователя и игры ИЛИ друг не в сети
			!socket ||
			!currentUser?.currentGame ||
			!currentUser?.appId ||
			!onlineUsers.includes(friendId)
		) {
			return;
		}

		// Отправляем событие на сервер
		socket.emit('sendGameInvite', {
			to: friendId,
			gameName: currentUser.currentGame,
			appId: currentUser.appId,
			lobbyId: currentUser.lobbyId || null,
		});
	};

	const canInvite =
		currentUser?.currentGame &&
		currentUser?.appId &&
		onlineUsers.includes(friendId);

	return (
		<div className={styles.container}>
			{!isMobile && canInvite && (
				<Button
					size='small'
					title={`Пригласить этого пользователя в ${currentUser?.currentGame}?`}
					onClick={handleInviteClick}>
					<Text as='span' size={26}>
						+
					</Text>
				</Button>
			)}

			<div className={styles.inputWrapper}>
				<MessageInput friendId={friendId} buttonSize={buttonSize} />
			</div>
		</div>
	);
};
