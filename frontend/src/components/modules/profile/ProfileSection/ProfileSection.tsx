import { useState } from 'react';

import { useDispatch, useSelector } from '@store';
import { logoutUser, selectUserData } from '@slices';
import type { TPopoverUserData } from '@types';

import { UserPopover, UserSettingsModal } from '@modals';

import { Button, Text, Avatar } from '@ui';

import styles from './ProfileSection.module.scss';
import { settingsIcon, logoutIcon } from '@icons';
import { defaultAvatar } from '@images';
export const ProfileSection = () => {
	const dispatch = useDispatch();
	const userData = useSelector(selectUserData);

	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const username = userData?.username || 'nickname';
	const avatarUrl = userData?.avatar || defaultAvatar;

	const popoverData: TPopoverUserData | null = userData
		? {
				_id: userData._id,
				username: userData.username,
				avatar: userData.avatar,
				bio: userData.bio,
				isOnline: true,
				currentGame: userData.currentGame,
			}
		: null;

	const handleLogout = () => {
		dispatch(logoutUser());
	};

	return (
		<>
			<div className={styles.container}>
				<div
					className={styles.userInfoWrapper}
					onClick={(e) => {
						e.stopPropagation();
						setIsPopoverOpen(!isPopoverOpen);
					}}
					onMouseDown={(e) => e.stopPropagation()}>
					<div className={styles.userInfo} title='Посмотреть профиль'>
						<Avatar src={avatarUrl} name={username} size='medium' />
						<div className={styles.textWrapper}>
							<Text as='p' size={22} align='left' className={styles.username}>
								{username}
							</Text>
							<div className={styles.statusContainer}>
								<div className={styles.status}></div>
								<Text
									as='p'
									size={12}
									align='left'
									className={userData?.currentGame ? styles.playingText : ''}>
									{userData?.currentGame ? `${userData.currentGame}` : 'онлайн'}
								</Text>
							</div>
						</div>
					</div>
				</div>
				<div className={styles.profileActions}>
					<Button
						size='small'
						title='Настройки'
						onClick={() => setIsSettingsOpen(true)}>
						<img src={settingsIcon} alt='Иконка настроек' />
					</Button>
					<Button size='small' title='Выйти' onClick={handleLogout}>
						<img src={logoutIcon} alt='Иконка выхода из приложения' />
					</Button>
				</div>

				{popoverData && (
					<div className={styles.popoverCenterTop}>
						<UserPopover
							isOpen={isPopoverOpen}
							user={popoverData}
							isSelf={true}
							onClose={() => setIsPopoverOpen(false)}>
							<Button
								onClick={(e) => {
									e.stopPropagation();
									setIsPopoverOpen(false);
									setIsSettingsOpen(true);
								}}
								style={{ flex: '1' }}
								title='Редактировать профиль'>
								редактировать профиль
							</Button>
						</UserPopover>
					</div>
				)}
			</div>

			{isSettingsOpen && userData && (
				<UserSettingsModal
					onClose={() => setIsSettingsOpen(false)}
					userData={userData}></UserSettingsModal>
			)}
		</>
	);
};
