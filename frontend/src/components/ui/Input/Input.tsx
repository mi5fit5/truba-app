import { type InputHTMLAttributes, useId, useState } from 'react';
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
	type,
	...rest
}: InputProps) => {
	const generatedId = useId();
	const inputId = id || generatedId;
	const [showPassword, setShowPassword] = useState(false);

	const isPassword = type === 'password';
	const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

	return (
		<div className={clsx(styles.fieldGroup, containerClassName)}>
			{label && (
				<label className={styles.label} htmlFor={inputId}>
					{label}
				</label>
			)}
			<div className={styles.inputWrapper}>
				<input
					id={inputId}
					type={inputType}
					className={clsx(
						styles.input,
						isPassword && styles.hasToggle,
						className
					)}
					{...rest}
				/>
				{isPassword && (
					<button
						type='button'
						className={clsx(styles.toggleBtn, showPassword && styles.toggled)}
						onClick={() => setShowPassword(!showPassword)}
						title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
					/>
				)}
			</div>
		</div>
	);
};
