import type { ReactNode } from 'react';
import { clsx } from 'clsx';

import styles from './Window.module.scss';

import { TitleBar } from '@ui';

interface WindowProps {
	title: string;
	icon?: ReactNode;
	className?: string;
	bodyClassName?: string;
	children: ReactNode;
}

export const Window = ({
	title,
	icon,
	className,
	bodyClassName,
	children,
}: WindowProps) => {
	return (
		<div className={clsx(styles.window, className)}>
			<TitleBar title={title} icon={icon} />
			<div className={clsx(styles.windowBody, bodyClassName)}>{children}</div>
		</div>
	);
};
