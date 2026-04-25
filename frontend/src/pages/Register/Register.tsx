import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RegisterForm } from '@forms';
import { Window, WindowFooter, Text, Button, Separator } from '@ui';

import styles from './Register.module.scss';
import { authIcon } from '@icons';

// Страница регистрации
export const Register = () => {
	const [isFormValid, setIsFormValid] = useState(false);
	const navigate = useNavigate();

	return (
		<div className={styles.container}>
			<Window
				title='регистрация - тРУба.exe'
				icon={<img src={authIcon} alt='Иконка в виде связки ключей' />}
				className={styles.authWindow}
				bodyClassName={styles.authWindowBody}>
				<Text as='h1' size={40} align='center'>
					проект &quot;тРУба&quot;
				</Text>
				<Separator />
				<Text as='p' size={26} align='center' lowercase>
					Пожалуйста, создайте новую
					<br />
					учётную запись
				</Text>
				<RegisterForm onValidationChange={setIsFormValid} />
				<WindowFooter>
					<Button type='submit' form='register-form' disabled={!isFormValid}>
						Регистрация
					</Button>
					<Button type='button' onClick={() => navigate('/login')}>
						Войти
					</Button>
				</WindowFooter>
			</Window>
		</div>
	);
};
