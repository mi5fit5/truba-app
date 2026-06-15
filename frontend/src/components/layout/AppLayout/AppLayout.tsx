import { Sidebar, ChatArea } from '@components';
import { useDispatch, useSelector } from '@store';
import { selectActiveFriendId, setActiveFriendId } from '@slices';

import { Button, Window } from '@ui';

import styles from './AppLayout.module.scss';
import { mainAppLogo } from '@icons';

export const AppLayout = () => {
	const dispatch = useDispatch();
	const activeFriendId = useSelector(selectActiveFriendId);

	const handleMobileBack = () => {
		dispatch(setActiveFriendId(null));
	};

	return (
		<div className={styles.container}>
			<Window
				title='тРУба.exe'
				icon={<img src={mainAppLogo} alt='Лого: Трубка телефона и Земля' />}
				className={styles.appWindow}>
				<div className={styles.mainArea}>
					<div
						className={`${styles.sidebarWrapper} ${activeFriendId ? styles.sidebarHidden : ''}`}>
						<Sidebar />
					</div>
					<div
						className={`${styles.chatWrapper} ${!activeFriendId ? styles.chatHidden : ''}`}>
						{activeFriendId && (
							<Button
								size='small'
								className={styles.mobileBackBtn}
								onClick={handleMobileBack}>
								вернуться к списку друзей и профилю
							</Button>
						)}
						<ChatArea />
					</div>
				</div>
			</Window>
		</div>
	);
};
