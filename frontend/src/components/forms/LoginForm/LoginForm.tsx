import React from 'react';

import { Input } from '../../ui/Input';

export const LoginForm = () => {
	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault();
	};

	return (
		<form id='auth-form' onSubmit={handleSubmit}>
			<Input label='почта:' type='email' placeholder='nickname' required />
			<Input label='пароль:' type='password' placeholder='password' required />
		</form>
	);
};
