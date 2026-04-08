import { Input } from '../../ui/Input';

// Форма регистрации
export const RegisterForm = () => {
	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault();
	};

	return (
		<form id='register-form' onSubmit={handleSubmit}>
			<Input label='никнейм:' type='text' placeholder='nickname' required />
			<Input
				label='почта:'
				type='email'
				placeholder='example@domain.com'
				required
			/>
			<Input label='пароль :' type='password' placeholder='password' required />
		</form>
	);
};
