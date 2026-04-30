import { useDispatch, useSelector } from '@store';
import { logoutUser, selectUserData } from '@slices';

import { Button, Text, Avatar } from '@ui';

import styles from './ProfileSection.module.scss';

import { settingsIcon, logoutIcon } from '@icons';
import { defaultAvatar } from '@images';

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
				<Avatar src={avatarUrl} name={username} size='medium' />
				<div className={styles.textWrapper}>
					<Text as='p' size={22} align='left' className={styles.username}>
						{username}
					</Text>
					<div className={styles.statusContainer}>
						<div className={styles.status}></div>
						<Text as='p' size={12} align='left'>
							онлайн
						</Text>
					</div>
				</div>
			</div>
			<div className={styles.profileActions}>
				<Button size='small' title='Настройки'>
					<img src={settingsIcon} alt='Иконка настроек: шестерёнки' />
				</Button>
				<Button size='small' title='Выйти' onClick={handleLogout}>
					<img
						src={logoutIcon}
						alt='Иконка выхода из приложения: выключающийся ПК'
					/>
				</Button>
			</div>
		</div>
	);
};
