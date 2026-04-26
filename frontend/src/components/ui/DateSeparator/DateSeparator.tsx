import { Separator, Text } from '@ui';

import styles from './DateSeparator.module.scss';

interface DateSeparatorProps {
	dateText: string;
}

export const DateSeparator = ({ dateText }: DateSeparatorProps) => {
	return (
		<div className={styles.container}>
			<div className={styles.line}>
				<Separator />
			</div>
			<Text
				as='span'
				size={13}
				align='center'
				lowercase
				className={styles.text}>
				{dateText}
			</Text>
			<div className={styles.line}>
				<Separator />
			</div>
		</div>
	);
};
