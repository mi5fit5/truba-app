import type { ElementType, ReactNode } from 'react';
import { clsx } from 'clsx';

import styles from './Text.module.scss';

interface TextProps {
	children: ReactNode;
	as?: ElementType;
	size?: 14 | 22 | 26 | 40;
	align?: 'left' | 'center';
	lowercase?: boolean;
	invert?: boolean;
}

export const Text = ({
	children,
	as: Tag = 'div',
	size = 22,
	align = 'left',
	lowercase = false,
	invert = false,
}: TextProps) => {
	const className = clsx(
		styles.text,
		styles[`size${size}`],
		styles[`${align}`],
		{ [styles.lowercase]: lowercase },
		{ [styles.invert]: invert }
	);

	return <Tag className={className}>{children}</Tag>;
};
