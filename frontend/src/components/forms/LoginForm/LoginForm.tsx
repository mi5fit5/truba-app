import React, { useState } from 'react';

import { Input } from '../../ui/Input';
import { useDispatch } from '../../../services/store';
import { loginUser } from '../../../services/slices/user/userSlice';

export const LoginForm = () => {
	// Локальное состояние формы
	const [formState, setFormState] = useState({ email: '', password: '' });
	const dispatch = useDispatch();

	// Обработчик полей ввода
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setFormState((prev) => ({ ...prev, [name]: value }));
	};

  // Обработчик отправки формы
	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault();
		dispatch(loginUser(formState));
	};

	return (
		<form id='auth-form' onSubmit={handleSubmit}>
			<Input
				label='почта:'
				name='email'
				value={formState.email}
				onChange={handleChange}
				type='email'
				placeholder='nickname'
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
