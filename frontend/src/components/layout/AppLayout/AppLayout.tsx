import { Sidebar, ChatArea } from '@components';

import { Window } from '@ui';

import styles from './AppLayout.module.scss';
import { mainAppLogo } from '@icons';

export const AppLayout = () => {
	return (
		<div className={styles.container}>
			<Window
				title='тРУба.exe'
				icon={<img src={mainAppLogo} alt='Лого: Трубка телефона и Земля' />}
				className={styles.appWindow}>
				<div className={styles.mainArea}>
					<Sidebar />
					<ChatArea />
				</div>
			</Window>
		</div>
	);
};
