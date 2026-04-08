import type { ReactNode } from 'react';
import { clsx } from 'clsx';

import styles from './Window.module.scss';

import { TitleBar } from '../TitleBar';

interface WindowProps {
	title: string;
	icon?: ReactNode;
	className?: string;
	children: ReactNode;
}

export const Window = ({ title, icon, className, children }: WindowProps) => {
	return (
		<div className={clsx(styles.window, className)}>
			<TitleBar title={title} icon={icon} />
			<div className={styles.windowBody}>{children}</div>
		</div>
	);
};
