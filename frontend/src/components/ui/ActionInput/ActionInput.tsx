import type React from 'react';
import { clsx } from 'clsx';

import { Button, Input } from '@ui';

import styles from './ActionInput.module.scss';

interface ActionInputProps {
	value: string;
	placeholder?: string;
	disabled?: boolean;
	iconSrc?: string;
	iconAlt?: string;
	className?: string;
	buttonTitle?: string;
	buttonSize?: 'small' | 'medium' | 'large';
	buttonText?: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onAction?: () => void;
}

export const ActionInput = ({
	value,
	placeholder,
	disabled,
	iconSrc,
	iconAlt,
	className,
	buttonTitle,
	buttonSize,
	buttonText,
	onChange,
	onAction,
}: ActionInputProps) => {
	const isActionDisabled = disabled || !value.trim();

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !disabled) {
			e.preventDefault();
			onAction?.();
		}
	};

	return (
		<div
			className={clsx(styles.container, className, {
				[styles.disabled]: disabled,
			})}>
			<Input
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				onKeyDown={handleKeyDown}
				containerClassName={styles.inputWrapper}
				disabled={disabled}
			/>
			<Button
				size={buttonSize}
				title={buttonTitle}
				onClick={onAction}
				disabled={isActionDisabled}>
				{iconSrc && <img src={iconSrc} alt={iconAlt} />}
				{buttonText && <span>{buttonText}</span>}
			</Button>
		</div>
	);
};
