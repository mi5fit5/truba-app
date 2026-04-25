import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { LoginForm } from '@forms';
import { Window, WindowFooter, Text, Button, Separator } from '@ui';

import styles from './Login.module.scss';
import { authIcon } from '@icons';

// Страница входа
export const Login = () => {
	const [isFormValid, setIsFormValid] = useState(false);
	const navigate = useNavigate();

	return (
		<div className={styles.container}>
			<Window
				title='вход - тРУба.exe'
				icon={<img src={authIcon} alt='Иконка в виде связки ключей' />}
				className={styles.authWindow}
				bodyClassName={styles.authWindowBody}>
				<Text as='h1' size={40} align='center'>
					проект &quot;тРУба&quot;
				</Text>
				<Separator />
				<Text as='p' size={26} align='center' lowercase>
					Пожалуйста, введите данные
					<br />
					для входа
				</Text>
				<LoginForm onValidationChange={setIsFormValid} />
				<WindowFooter>
					<Button type='submit' form='auth-form' disabled={!isFormValid}>
						Войти
					</Button>
					<Button type='button' onClick={() => navigate('/register')}>
						Регистрация
					</Button>
				</WindowFooter>
			</Window>
		</div>
	);
};
