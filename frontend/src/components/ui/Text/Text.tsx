import type { ElementType, ReactNode } from 'react';
import { clsx } from 'clsx';

import styles from './Text.module.scss';

interface TextProps {
	children: ReactNode;
	as?: ElementType;
	size?: 12 | 14 | 18 | 22 | 26 | 30 | 40;
	align?: 'left' | 'center';
	lowercase?: boolean;
	invert?: boolean;
	className?: string;
}

export const Text = ({
	children,
	as: Tag = 'div',
	size = 22,
	align = 'left',
	lowercase = false,
	invert = false,
	className,
}: TextProps) => {
	const classes = clsx(
		styles.text,
		styles[`size${size}`],
		styles[`${align}`],
		{ [styles.lowercase]: lowercase },
		{ [styles.invert]: invert },
		className
	);

	return <Tag className={classes}>{children}</Tag>;
};
