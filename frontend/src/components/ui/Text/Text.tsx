import type { ElementType, ReactNode } from 'react';
import { clsx } from 'clsx';

import styles from './Text.module.scss';

interface TextProps {
	children: ReactNode;
	as?: ElementType;
	size?: 22 | 26 | 40;
	align?: 'left' | 'center';
	lowercase?: boolean;
}

export const Text = ({
	children,
	as: Tag = 'div',
	size = 22,
	align = 'left',
	lowercase = false,
}: TextProps) => {
	console.log('Доступные стили:', styles);
	const className = clsx(
		styles.text,
		styles[`size${size}`],
		styles[`${align}`],
		{ [styles.lowercase]: lowercase }
	);

	return <Tag className={className}>{children}</Tag>;
};
