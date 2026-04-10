import React, { useState } from 'react';

import { useDispatch } from '../../../services/store';
import { Input } from '../../ui/Input';
import { registerUser } from '../../../services/slices/user/userSlice';

// Форма регистрации
export const RegisterForm = () => {
	// Локальное состояние формы
	const [formState, setFormState] = useState({
		username: '',
		email: '',
		password: '',
	});
	const dispatch = useDispatch();

	// Обработчик полей ввода
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setFormState((prev) => ({ ...prev, [name]: value }));
	};

	// Обработчик отправки формы
	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault();
		dispatch(registerUser(formState));
	};

	return (
		<form id='register-form' onSubmit={handleSubmit}>
			<Input
				label='никнейм:'
				name='username'
				value={formState.username}
				onChange={handleChange}
				type='text'
				placeholder='nickname'
				required
			/>
			<Input
				label='почта:'
				name='email'
				value={formState.email}
				onChange={handleChange}
				type='email'
				placeholder='example@domain.com'
				required
			/>
			<Input
				label='пароль:'
				name='password'
				value={formState.password}
				onChange={handleChange}
				type='password'
				placeholder='password'
				required
			/>
		</form>
	);
};
