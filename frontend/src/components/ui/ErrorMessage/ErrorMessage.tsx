import clsx from 'clsx';
import styles from './ErrorMessage.module.scss';
import { Text } from '@ui';

type TErrorMessageProps = {
	error?: string | null;
};

export const ErrorMessage = ({ error }: TErrorMessageProps) => {
	return (
		<div
			className={clsx(styles.container, {
				[styles.visible]: !!error,
			})}>
			<div className={styles.errorAlert}></div>
			<Text as='span' size={14} align='left' invert>
				{error || ' '}
			</Text>
		</div>
	);
};
