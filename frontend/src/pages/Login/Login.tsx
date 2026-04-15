import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import authIcon from '../../assets/icons/auth_icon.png';
import styles from './Login.module.scss';

import { LoginForm } from '../../components/forms/LoginForm';
import { Window } from '../../components/ui/Window';
import { WindowFooter } from '../../components/ui/WindowFooter';
import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Separator } from '../../components/ui/Separator';

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
