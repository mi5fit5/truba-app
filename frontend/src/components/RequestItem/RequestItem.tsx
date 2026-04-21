import { useDispatch } from '../../services/store';
import {
	acceptRequest,
	rejectRequest,
} from '../../services/slices/friendsSlice';

import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';

import styles from './RequestItem.module.scss';
import acceptIcon from '../../assets/icons/accept_icon.png';
import rejectIcon from '../../assets/icons/reject_icon.png';

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

	return (
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
					onClick={() => dispatch(acceptRequest(requestId))}>
					<img src={acceptIcon} alt='Принять запрос дружбы: галочка' />
				</button>
				<button
					className={styles.iconButton}
					disabled={isActionLoading}
					onClick={() => dispatch(rejectRequest(requestId))}>
					<img src={rejectIcon} alt='Отклонить запрос дружбы: крестик' />
				</button>
			</div>
		</div>
	);
};
