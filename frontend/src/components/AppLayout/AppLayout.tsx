import { Window } from '../ui/Window';

import styles from './AppLayout.module.scss';
import appLogo from '../../assets/icons/main_app-logo.png';
import { Sidebar } from '../Sidebar/Sidebar';
import { ChatArea } from '../ChatArea';

export const AppLayout = () => {
	return (
		<div className={styles.container}>
			<Window
				title='тРУба.exe'
				icon={<img src={appLogo} alt='Лого: Трубка телефона и Земля' />}
				className={styles.appWindow}>
				<div className={styles.mainArea}>
					<div className={styles.leftSide}>
						<Sidebar />
					</div>
					<div className={styles.rightSide}>
						<ChatArea />
					</div>
				</div>
			</Window>
		</div>
	);
};
