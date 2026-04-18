import { Window } from '../ui/Window';

import styles from './AppLayout.module.scss';
import appLogo from '../../assets/icons/main_app-logo.png';
import { ProfileSection } from '../ProfileSection';
import { Sidebar } from '../Sidebar/Sidebar';
import { Text } from '../ui/Text';

export const AppLayout = () => {
	return (
		<div className={styles.container}>
			<Window
				title='тРУба.exe'
				icon={<img src={appLogo} alt='Лого: Трубка телефона и Земля' />}
				className={styles.appWindow}>
				<div className={styles.mainArea}>
					<div className={styles.leftSide}>
						<div className={styles.placeholder}>
							<Sidebar />
						</div>
					</div>
					<div className={styles.rightSide}>
						<ProfileSection />
						<div className={styles.placeholder}>
							<Text as='p' size={40} lowercase align='center'>
								выберите друга
								<br />
								для общения
							</Text>
						</div>
					</div>
				</div>
			</Window>
		</div>
	);
};
