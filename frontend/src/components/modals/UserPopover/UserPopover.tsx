import { type ReactNode, useEffect, useRef } from 'react';
import clsx from 'clsx';

import type { TPopoverUserData } from '@types';
import { useSteamProfile } from '@hooks';

import { Avatar, Preloader, Separator, Text } from '@ui';
import styles from './UserPopover.module.scss';

interface UserPopoverProps {
	user: TPopoverUserData;
	isSelf?: boolean;
	children?: ReactNode;
	isOpen: boolean;
	onClose: () => void;
}

export const UserPopover = ({
	user,
	isSelf = false,
	children,
	isOpen,
	onClose,
}: UserPopoverProps) => {
	const { steamProfile, isLoadingSteam, steamError, fetchSteamProfile } =
		useSteamProfile();

	const popoverRef = useRef<HTMLDivElement | null>(null);

	// Загрузка данных Steam при открытии
	useEffect(() => {
		if (user._id) {
			fetchSteamProfile(isSelf ? undefined : user._id);
		}
	}, [user._id, isSelf, fetchSteamProfile]);

	// Закрытие по клику вне поповера
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				popoverRef.current &&
				!popoverRef.current.contains(e.target as Node)
			) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className={styles.popoverWrapper}
			ref={popoverRef}
			onClick={(e) => e.stopPropagation()}
			onMouseDown={(e) => e.stopPropagation()}>
			<div className={styles.sectionContainer}>
				<Text as='span' size={14} className={styles.sectionTitle}>
					ЛИЧНАЯ ИНФОРМАЦИЯ
				</Text>
				<div className={styles.profilePanel}>
					<div className={styles.staticItemContainer}>
						<div className={styles.infoWrapper}>
							<Avatar src={user.avatar} name={user.username} size='medium' />

							<div className={styles.infoText}>
								<Text as='p' size={18} align='left' className={styles.username}>
									{user.username}
								</Text>

								<div className={styles.statusWrapper}>
									<div
										className={clsx(
											styles.statusIndicator,
											user.isOnline ? styles.online : styles.offline
										)}
									/>
									<Text as='span' size={12} align='left'>
										{user.currentGame
											? `играет в ${user.currentGame}`
											: user.isOnline
												? 'онлайн'
												: 'офлайн'}
									</Text>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Separator />

			<div className={styles.sectionContainer}>
				<Text as='span' size={12} className={styles.sectionTitle}>
					О СЕБЕ
				</Text>
				<div className={clsx(styles.profilePanel, styles.bioPanel)}>
					{user.bio ? (
						<Text as='p' size={14} align='left' className={styles.bioText}>
							{user.bio}
						</Text>
					) : (
						<Text as='p' size={14} align='left' className={styles.emptyText}>
							{user.username} нечего рассказать о себе...
						</Text>
					)}
				</div>
			</div>
			<Separator />

			<div className={styles.sectionContainer}>
				<Text as='span' size={12} className={styles.sectionTitle}>
					STEAM
				</Text>

				<div className={styles.profilePanel}>
					{isLoadingSteam ? (
						<div className={styles.loaderWrapper}>
							<Preloader />
						</div>
					) : steamError || !steamProfile ? (
						<Text as='p' size={14} align='center' className={styles.emptyText}>
							{isSelf ? 'Steam не подключен' : 'нет привязанных аккаунтов'}
						</Text>
					) : (
						<a
							href={steamProfile.profileUrl}
							target='_blank'
							rel='noopener noreferrer'
							className={styles.interactiveItemContainer}
							title='Открыть профиль Steam'>
							<div className={styles.infoWrapper}>
								<Avatar
									src={steamProfile.avatar}
									name={steamProfile.steamName}
									size='medium'
								/>
								<div className={styles.infoText}>
									<Text as='p' size={18} align='left'>
										{steamProfile.steamName}
									</Text>
									<Text as='span' size={12} align='left'>
										подключено
									</Text>
								</div>
							</div>
						</a>
					)}
				</div>
			</div>

			{children && (
				<>
					<Separator />
					<div className={styles.actionsSection}>{children}</div>
				</>
			)}
		</div>
	);
};
