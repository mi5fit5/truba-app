import { RegisterForm } from '@forms';
import { Window, Text, Separator } from '@ui';

import styles from './Register.module.scss';
import { authIcon } from '@icons';

// Страница регистрации
export const Register = () => {
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
				<RegisterForm />
			</Window>
		</div>
	);
};
