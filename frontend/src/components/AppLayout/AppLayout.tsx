import { Window } from '../ui/Window';

import styles from './AppLayout.module.scss';
import appLogo from '../../assets/icons/main_app-logo.png';
import { ProfileSection } from '../ProfileSection';

export const AppLayout = () => {
	return (
		<div className={styles.container}>
			<Window
				title='тРУба.exe'
				icon={<img src={appLogo} alt='Лого: Трубка телефона и Земля' />}
				className={styles.appWindow}>
				<div className={styles.mainArea}>
					<div className={styles.leftSide}>
						<div className={styles.placeholder}></div>
					</div>
					<div className={styles.rightSide}>
						<ProfileSection />
						<div className={styles.placeholder}>выберите друга для общения</div>
					</div>
				</div>
			</Window>
		</div>
	);
};
