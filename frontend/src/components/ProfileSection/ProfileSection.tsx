import {
	logoutUser,
	selectUserData,
} from '../../services/slices/user/userSlice';
import { useDispatch, useSelector } from '../../services/store';

import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';

import styles from './ProfileSection.module.scss';
import defaultAvatar from '../../assets/images/default_avatar.jpg';
import settingsIcon from '../../assets/icons/settings_icon.png';
import logoutIcon from '../../assets/icons/logout_icon.png';

export const ProfileSection = () => {
	const dispatch = useDispatch();
	const userData = useSelector(selectUserData);

	const username = userData?.username || 'nickname';
	const avatarUrl = userData?.avatar || defaultAvatar;

	const handleLogout = () => {
		dispatch(logoutUser());
	};

	return (
		<div className={styles.container}>
			<div className={styles.userInfo}>
				<Avatar src={avatarUrl} name={username} size='large' />
				<div>
					<Text as='p' size={30} align='left'>
						{username}
					</Text>
					<div className={styles.statusContainer}>
						<div className={styles.status}></div>
						<Text as='p' size={14} align='left'>
							онлайн
						</Text>
					</div>
				</div>
			</div>
			<div className={styles.profileActions}>
				<Button size='medium' style={{ gap: '4px' }}>
					<img src={settingsIcon} alt='Иконка настроек: шестерёнки' />
					настройки
				</Button>
				<Button size='medium' style={{ gap: '4px' }} onClick={handleLogout}>
					<img
						src={logoutIcon}
						alt='Иконка выхода из приложения: выключащийся ПК'
					/>
					выйти
				</Button>
			</div>
		</div>
	);
};
