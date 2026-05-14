import React, { useState } from 'react';
import clsx from 'clsx';

import type {
	TUser,
	TUserSettingsTab,
	TUpdateProfileData,
	TChangePasswordForm,
} from '@types';
import { useDispatch } from '@store';
import { changeUserPassword, updateUserProfile } from '@slices';
import { useFormWithValidation } from '@hooks';
import { changePasswordValidators, profileValidators } from '@utils/validators';

import { Button, Modal, Window, Input, StatusMessage, TextArea } from '@ui';
import styles from './UserSettingsModal.module.scss';
import { settingsIcon } from '@icons';

interface UserSettingsModalProps {
	onClose: () => void;
	userData: TUser;
}

export const UserSettingsModal = ({
	onClose,
	userData,
}: UserSettingsModalProps) => {
	const dispatch = useDispatch();
	const [activeTab, setActiveTab] = useState<TUserSettingsTab>('profile');

	const {
		inputValues: profileValues,
		errors: profileErrors,
		isValid: isProfileValid,
		handleChange: handleProfileChange,
	} = useFormWithValidation<TUpdateProfileData>(
		{ avatar: '', bio: userData.bio || '' },
		profileValidators
	);

	const [isProfileLoading, setIsProfileLoading] = useState(false);

	const {
		inputValues: passwordValues,
		errors: passwordErrors,
		isValid: isPasswordValid,
		handleChange: handlePasswordChange,
		resetForm: resetPasswordForm,
	} = useFormWithValidation<TChangePasswordForm>(
		{ oldPassword: '', newPassword: '', confirmPassword: '' },
		changePasswordValidators
	);

	const [passwordStatus, setPasswordStatus] = useState<{
		text: string;
		type: 'error' | 'success';
	} | null>(null);
	const [isSecurityLoading, setIsSecurityLoading] = useState(false);

	// Обработчик сабмита формы обновления профиля
	const handleProfileSubmit = async () => {
		if (!isProfileValid) return;

		try {
			setIsProfileLoading(true);

			await dispatch(
				updateUserProfile({
					avatar: profileValues.avatar ? profileValues.avatar : userData.avatar,
					bio: profileValues.bio,
				})
			).unwrap();
		} catch (err: unknown) {
			console.error('Ошибка обновления профиля:', err);
		} finally {
			setIsProfileLoading(false);
		}
	};

	// Обработчик сабмита формы смены пароля
	const handlePasswordSubmit = async () => {
		setPasswordStatus(null);

		if (passwordValues.newPassword !== passwordValues.confirmPassword) {
			return setPasswordStatus({
				text: 'Новые пароли не совпадают',
				type: 'error',
			});
		}

		try {
			setIsSecurityLoading(true);

			const message = await dispatch(
				changeUserPassword({
					oldPassword: passwordValues.oldPassword,
					newPassword: passwordValues.newPassword,
				})
			).unwrap();

			setPasswordStatus({ text: message, type: 'success' });
		} catch (err: unknown) {
			setPasswordStatus({
				text: typeof err === 'string' ? err : 'Ошибка при смене пароля',
				type: 'error',
			});
		} finally {
			setIsSecurityLoading(false);
		}
	};

	// Обработчик инпутов формы смены пароля
	const onPasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handlePasswordChange(e);

		if (passwordStatus) setPasswordStatus(null);
	};

	// Обработчик очистки формы смены пароля
	const handleClearPasswordForm = () => {
		if (resetPasswordForm)
			resetPasswordForm({
				oldPassword: '',
				newPassword: '',
				confirmPassword: '',
			});

		setPasswordStatus(null);
	};

	// Обработчик для кнопки '"Ок"
	const handleOkayClick = async () => {
		if (activeTab === 'profile' && isProfileChanged) {
			await handleProfileSubmit();
			onClose();
		} else {
			onClose();
		}
	};

	// Есть ли несохраненные изменения во вкладке профиля
	const isProfileChanged =
		profileValues.bio !== (userData.bio || '') ||
		profileValues.avatar !== (userData.avatar || '');

	return (
		<Modal onClose={onClose}>
			<Window
				title='свойства - тРУба.exe'
				icon={<img src={settingsIcon} alt='Настройки' />}
				className={styles.settingsWindow}
				bodyClassName={styles.container}>
				<nav className={styles.tabsHeader}>
					<Button
						size='medium'
						className={clsx(
							styles.tabTrigger,
							activeTab === 'profile' && styles.activeTab
						)}
						onClick={() => setActiveTab('profile')}>
						профиль
					</Button>
					<Button
						size='medium'
						className={clsx(
							styles.tabTrigger,
							activeTab === 'security' && styles.activeTab
						)}
						onClick={() => setActiveTab('security')}>
						защита
					</Button>
					<Button
						size='medium'
						className={clsx(
							styles.tabTrigger,
							activeTab === 'audio' && styles.activeTab
						)}
						onClick={() => setActiveTab('audio')}>
						медиа
					</Button>
					<Button
						size='medium'
						className={clsx(
							styles.tabTrigger,
							activeTab === 'integration' && styles.activeTab
						)}
						onClick={() => setActiveTab('integration')}>
						steam
					</Button>
				</nav>

				<div className={styles.tabContent}>
					{/* Профиль */}
					{activeTab === 'profile' && (
						<div className={styles.contentSection}>
							<div className={styles.fieldGroup}>
								<Input
									label='обновить аватар:'
									name='avatar'
									type='text'
									value={profileValues.avatar}
									onChange={
										handleProfileChange as React.ChangeEventHandler<HTMLInputElement>
									}
									placeholder='ссылка на картинку'
								/>
								<StatusMessage message={profileErrors.avatar} type='error' />
							</div>
							<div className={styles.fieldGroup}>
								<TextArea
									label={`о себе (${profileValues.bio?.length || 0}/160):`}
									name='bio'
									value={profileValues.bio}
									onChange={
										handleProfileChange as React.ChangeEventHandler<HTMLTextAreaElement>
									}
									placeholder='расскажите о себе...'
								/>
								<StatusMessage message={profileErrors.bio} type='error' />
							</div>
						</div>
					)}

					{/* Безопасность */}
					{activeTab === 'security' && (
						<div className={styles.contentSection}>
							<div className={styles.fieldGroup}>
								<Input
									label='текущий пароль:'
									name='oldPassword'
									type='password'
									value={passwordValues.oldPassword}
									onChange={onPasswordInputChange}
									required
								/>
								<StatusMessage
									message={passwordErrors.oldPassword}
									type='error'
								/>
							</div>
							<div className={styles.fieldGroup}>
								<Input
									label='новый пароль:'
									name='newPassword'
									type='password'
									value={passwordValues.newPassword}
									onChange={onPasswordInputChange}
									required
								/>
								<StatusMessage
									message={passwordErrors.newPassword}
									type='error'
								/>
							</div>
							<div className={styles.fieldGroup}>
								<Input
									label='подтвердите новый пароль:'
									name='confirmPassword'
									type='password'
									value={passwordValues.confirmPassword}
									onChange={onPasswordInputChange}
									required
								/>
								<StatusMessage
									message={passwordErrors.confirmPassword}
									type='error'
								/>
							</div>
							<div className={styles.fieldGroup}>
								<div className={styles.changePasswordActions}>
									<Button
										size='large'
										onClick={handlePasswordSubmit}
										disabled={!isPasswordValid || isSecurityLoading}>
										{isSecurityLoading ? 'изменение...' : 'сменить пароль'}
									</Button>
									<Button
										size='large'
										onClick={handleClearPasswordForm}
										disabled={isSecurityLoading}>
										очистить
									</Button>
								</div>
								<StatusMessage
									message={passwordStatus?.text}
									type={passwordStatus?.type}
								/>
							</div>
						</div>
					)}

					{/* TODO: Сделать вкладку медиа */}
					{activeTab === 'audio' && <div></div>}

					{/* TODO: Сделать вкладку интеграций */}
					{activeTab === 'integration' && <div></div>}
				</div>

				<footer className={styles.footer}>
					<Button
						size='medium'
						onClick={handleOkayClick}
						disabled={
							isProfileLoading || (activeTab === 'profile' && !isProfileValid)
						}>
						ок
					</Button>
					<Button size='medium' onClick={onClose}>
						отмена
					</Button>
					<Button
						size='large'
						onClick={handleProfileSubmit}
						disabled={
							activeTab !== 'profile' ||
							!isProfileChanged ||
							isProfileLoading ||
							!isProfileValid
						}>
						применить
					</Button>
				</footer>
			</Window>
		</Modal>
	);
};
