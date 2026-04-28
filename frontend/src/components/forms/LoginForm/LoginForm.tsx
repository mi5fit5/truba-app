import React from 'react';
import { useNavigate } from 'react-router-dom';

import type { TLoginData } from '@types';
import { useDispatch, useSelector } from '@store';
import { clearAuthError, loginUser, selectAuthError } from '@slices';
import { useFormWithValidation } from '@hooks';
import { loginValidators } from '@utils/validators';

import { Input, ErrorMessage, Button } from '@ui';

import styles from './LoginForm.module.scss';

// Форма входа
export const LoginForm = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const authError = useSelector(selectAuthError);

	const { inputValues, errors, isValid, handleChange } =
		useFormWithValidation<TLoginData>(
			{ email: '', password: '' },
			loginValidators
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
			dispatch(loginUser(inputValues));
		}
	};

	return (
		<form onSubmit={handleSubmit} className={styles.container}>
			<div className={styles.section}>
				<Input
					label='почта:'
					name='email'
					value={inputValues.email}
					onChange={handleInputChange}
					type='email'
					placeholder='nickname'
					required
				/>
				<ErrorMessage error={errors.email} />
			</div>
			<div className={styles.section}>
				<Input
					label='пароль:'
					name='password'
					value={inputValues.password}
					onChange={handleInputChange}
					type='password'
					placeholder='password'
					required
				/>
				<ErrorMessage error={errors.password} />
			</div>
			<div className={styles.section}>
				<div className={styles.footer}>
					<Button type='submit' disabled={!isValid}>
						Войти
					</Button>
					<Button type='button' onClick={() => navigate('/register')}>
						Регистрация
					</Button>
				</div>
				<ErrorMessage error={authError} />
			</div>
		</form>
	);
};
