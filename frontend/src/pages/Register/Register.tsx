import { useNavigate } from 'react-router-dom';

import authIcon from '../../assets/images/auth_icon.png';
import styles from './Register.module.scss';

import { RegisterForm } from '../../components/forms/RegisterForm';
import { Window } from '../../components/ui/Window';
import { WindowFooter } from '../../components/ui/WindowFooter';
import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Separator } from '../../components/ui/Separator';

// Страница регистрации
export const Register = () => {
	const navigate = useNavigate();

	return (
		<div className={styles.container}>
			<Window
				title='регистрация - тРУба.exe'
				icon={<img src={authIcon} alt='Иконка в виде связки ключей' />}>
				<Text as='h1' size={40} align='center'>
					проект &quot;тРУба&quot;
				</Text>
				<Separator />
				<Text as='p' size={26} align='center' lowercase={true}>
					Пожалуйста, создайте новую
					<br />
					учётную запись
				</Text>
				<RegisterForm />
				<WindowFooter>
					<Button type='submit' form='auth-form'>
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
