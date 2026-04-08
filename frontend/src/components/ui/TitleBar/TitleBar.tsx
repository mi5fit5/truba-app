import React from 'react';
import { clsx } from 'clsx';

import styles from './TitleBar.module.scss';

interface TitleBarProps {
	title: string;
	icon?: React.ReactNode;
	className?: string;
}

export const TitleBar = ({ title, icon, className }: TitleBarProps) => {
	return (
		<div className={clsx(styles.titleBar, className)}>
			<div className={styles.titleContent}>
				{icon && <span className={styles.iconWrapper}>{icon}</span>}
				<span className={styles.titleText}>{title}</span>
			</div>

			<div className={styles.controls}>
				<button type='button' className={styles.controlButton}>
					_
				</button>
				<button type='button' className={styles.controlButton}>
					□
				</button>
				<button type='button' className={clsx(styles.controlButton)}>
					X
				</button>
			</div>
		</div>
	);
};
