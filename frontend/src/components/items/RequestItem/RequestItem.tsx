import { useState } from 'react';

import { useDispatch } from '@store';
import { acceptRequest, rejectRequest } from '@slices';

import { DialogModal } from '@modals';
import { Text, Avatar } from '@ui';

import styles from './RequestItem.module.scss';
import { acceptIcon, rejectIcon } from '@icons';

interface RequestItemProps {
	requestId: string;
	username: string;
	avatar: string;
	isActionLoading: boolean;
}

export const RequestItem = ({
	requestId,
	username,
	avatar,
	isActionLoading,
}: RequestItemProps) => {
	const dispatch = useDispatch();

	const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

	const handleRejectClick = () => {
		setIsRejectModalOpen(true);
	};

	const confirmReject = () => {
		dispatch(rejectRequest(requestId));
		setIsRejectModalOpen(false);
	};

	return (
		<>
			<div className={styles.container}>
				<div className={styles.infoWrapper}>
					<Avatar src={avatar} name={username} size='medium' />
					<div className={styles.senderInfo}>
						<Text as='p' size={22} align='left'>
							{username}
						</Text>
						<Text as='span' size={12} lowercase align='left'>
							стать друзьями?
						</Text>
					</div>
				</div>
				<div className={styles.requestActions}>
					<button
						className={styles.iconButton}
						disabled={isActionLoading}
						title='Принять запрос дружбы'
						onClick={() => dispatch(acceptRequest(requestId))}>
						<img src={acceptIcon} alt='Принять запрос дружбы: галочка' />
					</button>
					<button
						className={styles.iconButton}
						disabled={isActionLoading}
						title='Отклонить запрос дружбы'
						onClick={handleRejectClick}>
						<img src={rejectIcon} alt='Отклонить запрос дружбы: крестик' />
					</button>
				</div>
			</div>

			<DialogModal
				isOpen={isRejectModalOpen}
				type='warning'
				title='внимание - тРУба.exe'
				message={`Отклонить заявку в друзья от пользователя ${username}?`}
				confirmText='отклонить'
				cancelText='отмена'
				onClose={() => setIsRejectModalOpen(false)}
				onConfirm={confirmReject}
			/>
		</>
	);
};
