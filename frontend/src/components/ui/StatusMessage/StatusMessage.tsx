import clsx from 'clsx';
import styles from './StatusMessage.module.scss';
import { Text } from '@ui';

type TStatusMessageProps = {
	message?: string | null;
	type?: 'error' | 'success';
	className?: string;
};

export const StatusMessage = ({
	message,
	type = 'error',
	className,
}: TStatusMessageProps) => {
	return (
		<div
			className={clsx(styles.container, message && styles.visible, className)}>
			<div
				className={clsx(
					styles.alertLine,
					type === 'error' ? styles.lineError : styles.lineSuccess
				)}
			/>
			<div className={styles.errorAlert}></div>
			<Text as='span' size={13} align='left'>
				{message}
			</Text>
		</div>
	);
};
