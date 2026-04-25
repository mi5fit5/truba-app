import React from 'react';
import { useNavigate } from 'react-router-dom';

import type { TRegisterData } from '@types';
import { useDispatch, useSelector } from '@store';
import { clearAuthError, registerUser, selectAuthError } from '@slices';
import { useFormWithValidation } from '@hooks/useFormWithValidation';
import { registerValidators } from '@utils/validators';

import { Input, Button, ErrorMessage } from '@ui';

import styles from './RegisterForm.module.scss';

// Форма регистрации
export const RegisterForm = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const authError = useSelector(selectAuthError);

	const { inputValues, errors, isValid, handleChange } =
		useFormWithValidation<TRegisterData>(
			{ username: '', email: '', password: '' },
			registerValidators
		);

	// Обработчик инпута
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleChange(e);

		if (authError) {
			dispatch(clearAuthError());
		}
	};

	// Обработчик отправки формы
	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault();

		if (isValid) {
			dispatch(registerUser(inputValues));
		}
	};

	return (
		<form onSubmit={handleSubmit} className={styles.container}>
			<div className={styles.section}>
				<Input
					label='никнейм:'
					name='username'
					value={inputValues.username}
					onChange={handleInputChange}
					type='text'
					placeholder='nickname'
					required
				/>
				<ErrorMessage error={errors.username} />
			</div>
			<div className={styles.section}>
				<Input
					label='почта:'
					name='email'
					value={inputValues.email}
					onChange={handleInputChange}
					type='email'
					placeholder='example@domain.com'
					required
				/>
				<ErrorMessage error={errors.email} />
			</div>
			<div className={styles.section}>
				<Input
					label='пароль:'
					name='password'
					value={inputValues.password}
					onChange={handleChange}
					type='password'
					placeholder='password'
					required
				/>
				<ErrorMessage error={errors.password} />
			</div>
			<div className={styles.section}>
				<div className={styles.footer}>
					<Button type='submit' disabled={!isValid}>
						Регистрация
					</Button>
					<Button type='button' onClick={() => navigate('/login')}>
						Войти
					</Button>
				</div>
				<ErrorMessage error={authError} />
			</div>
		</form>
	);
};
