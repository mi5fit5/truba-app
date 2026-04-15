import { clsx } from 'clsx';
import styles from './Button.module.scss';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	size?: 'large' | 'medium' | 'small';
}

export const Button = ({
	children,
	className,
	size = 'large',
	...rest
}: ButtonProps) => {
	return (
		<button className={clsx(styles.button, styles[size], className)} {...rest}>
			{children}
		</button>
	);
};
