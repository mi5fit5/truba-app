import React, { useEffect } from 'react';

import type { TLoginData } from '../../../types';
import { useDispatch } from '../../../services/store';
import { useFormWithValidation } from '../../../hooks/useFormWithValidation';
import { loginUser } from '../../../services/slices/user/userSlice';
import { loginValidators } from '../../../utils/validators';

import { Input } from '../../ui/Input';
import { ErrorMessage } from '../../ui/ErrorMessage';

type TLoginFormProps = {
	onValidationChange: (isValid: boolean) => void;
};

// Форма входа
export const LoginForm = ({ onValidationChange }: TLoginFormProps) => {
	const dispatch = useDispatch();
	const { inputValues, errors, isValid, handleChange } =
		useFormWithValidation<TLoginData>(
			{ email: '', password: '' },
			loginValidators
		);

	useEffect(() => {
		onValidationChange(isValid);
	}, [isValid, onValidationChange]);

	// Обработчик отправки формы
	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault();

		if (isValid) {
			dispatch(loginUser(inputValues));
		}
	};

	return (
		<form
			id='auth-form'
			onSubmit={handleSubmit}
			style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
			<div>
				<Input
					label='почта:'
					name='email'
					value={inputValues.email}
					onChange={handleChange}
					type='email'
					placeholder='nickname'
					required
				/>
				<ErrorMessage error={errors.email} />
			</div>
			<div>
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
		</form>
	);
};
