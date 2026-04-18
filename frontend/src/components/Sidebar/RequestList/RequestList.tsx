import { useSelector } from '../../../services/store';
import { selectIsActionLoading } from '../../../services/slices/friendsSlice';
import type { TFriendRequest } from '../../../types';

import { Text } from '../../ui/Text';
import { RequestItem } from '../../RequestItem';

import styles from './RequestList.module.scss';

interface RequestListProps {
	requests: TFriendRequest[];
}

export const RequestList = ({ requests }: RequestListProps) => {
	const isActionLoading = useSelector(selectIsActionLoading);

	return (
		<div className={styles.container}>
			<Text as='p' size={30} lowercase align='left'>
				заявки:
			</Text>
			<div className={styles.listWrapper}>
				{requests.length > 0 ? (
					requests.map((req) => (
						<RequestItem
							key={req._id}
							requestId={req._id}
							username={req.sender.username}
							avatar={req.sender.avatar}
							isActionLoading={isActionLoading}
						/>
					))
				) : (
					<Text as='p' size={14} lowercase align='left'>
						Похоже тут ничего нет...
					</Text>
				)}
			</div>
		</div>
	);
};
