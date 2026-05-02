import { useNavigate } from 'react-router-dom';

import { Window, Text, Button } from '@ui';

import styles from './NotFound.module.scss';
import { notFoundIcon } from '@icons';

export const NotFound = () => {
	const navigate = useNavigate();

	return (
		<div className={styles.pageWrapper}>
			<Window
				title='3rR0r-404'
				icon={<img src={notFoundIcon} alt='Иконка в виде пустого окна' />}
				className={styles.pageWindow}
				bodyClassName={styles.windowContainer}>
				<div className={styles.content}>
					<div className={styles.centerBlock}>
						<Text as='h1' size={40} align='center' className={styles.errorCode}>
							&#60;Ошибка&#62;
							<br />
							404:
						</Text>
						<div className={styles.errorBox}>
							<Text as='p' size={22} align='center' invert>
								страница не найдена
							</Text>
						</div>
					</div>
					<div className={styles.buttonContainer}>
						<Button size='huge' onClick={() => navigate('/')}>
							на главную
						</Button>
					</div>
				</div>
			</Window>
		</div>
	);
};
