import { type InputHTMLAttributes, useId } from 'react';
import { clsx } from 'clsx';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	containerClassName?: string;
}

export const Input = ({
	label,
	className,
	containerClassName,
	id,
	...rest
}: InputProps) => {
	const generatedId = useId();
	const inputId = id || generatedId;

	return (
		<div className={clsx(styles.fieldGroup, containerClassName)}>
			{label && (
				<label className={styles.label} htmlFor={inputId}>
					{label}
				</label>
			)}
			<input id={inputId} className={clsx(styles.input, className)} {...rest} />
		</div>
	);
};
