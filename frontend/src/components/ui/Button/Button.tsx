import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

import styles from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	size?: 'huge' | 'large' | 'medium' | 'small';
	variant?: 'default' | 'red';
}

export const Button = ({
	children,
	className,
	size = 'large',
	variant = 'default',
	...rest
}: ButtonProps) => {
	return (
		<button
			className={clsx(
				styles.button,
				styles[size],
				variant === 'red' && styles.red,
				className
			)}
			{...rest}>
			{children}
		</button>
	);
};
