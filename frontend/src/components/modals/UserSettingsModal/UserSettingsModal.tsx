import React, { useState } from 'react';
import clsx from 'clsx';

import { NOISE_OPTIONS } from '@constants';
import type {
	TUser,
	TUserSettingsTab,
	TUpdateProfileData,
	TChangePasswordForm,
	TNoiseMode,
} from '@types';
import { usePeerContext } from '@context';
import { useDispatch } from '@store';
import { changeUserPassword, updateUserProfile } from '@slices';
import { useFormWithValidation } from '@hooks';
import { changePasswordValidators, profileValidators } from '@utils/validators';

import {
	Button,
	Modal,
	Window,
	Input,
	StatusMessage,
	TextArea,
	Select,
} from '@ui';
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
	const {
		availableMics,
		availableCams,
		selectedMic,
		selectedCam,
		noiseMode,
		switchDevice,
		applyNoiseMode,
	} = usePeerContext();

	// Обработчик смены медиа-устройств и шумодава
	const handleMicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		switchDevice('audio', e.target.value, noiseMode);
	};

	const handleCamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		switchDevice('video', e.target.value, noiseMode);
	};

	const handleNoiseModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		applyNoiseMode(e.target.value as TNoiseMode);
	};

	const [activeTab, setActiveTab] = useState<TUserSettingsTab>('profile');

	// Валидация пароля
	const {
		inputValues: profileValues,
		errors: profileErrors,
		isValid: isProfileValid,
		handleChange: handleProfileChange,
		resetForm: resetProfileForm,
	} = useFormWithValidation<TUpdateProfileData>(
		{ avatar: '', bio: userData.bio || '' },
		profileValidators
	);

	const [profileStatus, setProfileStatus] = useState<{
		text: string;
		type: 'error' | 'success';
	} | null>(null);
	const [isProfileLoading, setIsProfileLoading] = useState(false);

	// Есть ли несохраненные изменения во вкладке профиля
	const isProfileChanged =
		profileValues.bio !== (userData.bio || '') ||
		profileValues.avatar !== (userData.avatar || '');

	// Валидация пароля
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

	// Сохранение настроек профиля
	const handleProfileSubmit = async () => {
		if (!isProfileValid) return;
		setProfileStatus(null);

		try {
			setIsProfileLoading(true);

			await dispatch(
				updateUserProfile({
					avatar: profileValues.avatar ? profileValues.avatar : userData.avatar,
					bio: profileValues.bio,
				})
			).unwrap();

			setProfileStatus({ text: 'Профиль успешно обновлен', type: 'success' });
		} catch (err: unknown) {
			console.error('Ошибка обновления профиля:', err);
			setProfileStatus({ text: 'Не удалось обновить профиль', type: 'error' });
		} finally {
			setIsProfileLoading(false);
		}
	};

	// Сохранение изменения пароля
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

	// Обработчик очистки форм
	const handleClearForm = () => {
		if (resetProfileForm) {
			resetProfileForm({
				avatar: '',
				bio: userData.bio || '',
			});

			setProfileStatus(null);
		}

		if (resetPasswordForm) {
			resetPasswordForm({
				oldPassword: '',
				newPassword: '',
				confirmPassword: '',
			});

			setPasswordStatus(null);
		}
	};

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
							<div className={styles.fieldGroup}>
								<div className={styles.changePasswordActions}>
									<Button
										size='large'
										onClick={handleProfileSubmit}
										disabled={
											!isProfileChanged || isProfileLoading || !isProfileValid
										}>
										{isProfileLoading ? 'сохранение...' : 'сохранить'}
									</Button>
									<Button
										size='large'
										onClick={handleClearForm}
										disabled={isProfileLoading}>
										сбросить
									</Button>
								</div>
								<StatusMessage
									message={profileStatus?.text}
									type={profileStatus?.type}
								/>
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
										onClick={handleClearForm}
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

					{/* Медиа */}
					{activeTab === 'audio' && (
						<div className={styles.contentSection}>
							<Select
								label='микрофон:'
								options={availableMics}
								value={selectedMic}
								onChange={handleMicChange}
								fallbackText='микрофоны не найдены'
							/>
							<Select
								label='камера:'
								options={availableCams}
								value={selectedCam}
								onChange={handleCamChange}
								fallbackText='камеры не найдены'
							/>
							<Select
								label='шумоподавление:'
								options={NOISE_OPTIONS}
								value={noiseMode}
								onChange={handleNoiseModeChange}
							/>
						</div>
					)}

					{/* TODO: Сделать вкладку интеграций */}
					{activeTab === 'integration' && <div></div>}
				</div>

				<footer className={styles.footer}>
					<Button onClick={onClose} style={{ flex: '1' }}>
						закрыть настройки
					</Button>
				</footer>
			</Window>
		</Modal>
	);
};
