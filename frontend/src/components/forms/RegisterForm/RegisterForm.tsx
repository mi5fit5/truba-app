import React, { useEffect } from 'react';

import type { TRegisterData } from '../../../types';
import { useDispatch } from '../../../services/store';
import { useFormWithValidation } from '../../../hooks/useFormWithValidation';
import { registerUser } from '../../../services/slices/userSlice';
import { registerValidators } from '../../../utils/validators';

import { Input } from '../../ui/Input';
import { ErrorMessage } from '../../ui/ErrorMessage';

type TRegisterFormProps = {
	onValidationChange: (isValid: boolean) => void;
};

// Форма регистрации
export const RegisterForm = ({ onValidationChange }: TRegisterFormProps) => {
	const dispatch = useDispatch();
	const { inputValues, errors, isValid, handleChange } =
		useFormWithValidation<TRegisterData>(
			{ username: '', email: '', password: '' },
			registerValidators
		);

	useEffect(() => {
		onValidationChange(isValid);
	}, [isValid, onValidationChange]);

	// Обработчик отправки формы
	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault();

		if (isValid) {
			dispatch(registerUser(inputValues));
		}
	};

	return (
		<form
			id='register-form'
			onSubmit={handleSubmit}
			style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
			<div>
				<Input
					label='никнейм:'
					name='username'
					value={inputValues.username}
					onChange={handleChange}
					type='text'
					placeholder='nickname'
					required
				/>
				<ErrorMessage error={errors.username} />
			</div>
			<div>
				<Input
					label='почта:'
					name='email'
					value={inputValues.email}
					onChange={handleChange}
					type='email'
					placeholder='example@domain.com'
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
