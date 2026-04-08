import { clsx } from 'clsx';
import styles from './Button.module.scss';
import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ children, className, ...rest }: ButtonProps) => {
	return (
		<button className={clsx(styles.button, className)} {...rest}>
			{children}
		</button>
	);
};
