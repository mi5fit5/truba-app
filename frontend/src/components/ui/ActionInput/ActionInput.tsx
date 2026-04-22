import type React from 'react';
import { clsx } from 'clsx';

import { Button } from '../Button';
import { Input } from '../Input';

import styles from './ActionInput.module.scss';

interface ActionInputProps {
	value: string;
	placeholder?: string;
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
	iconSrc,
	iconAlt,
	className,
  buttonTitle,
  buttonSize,
  buttonText,
	onChange,
	onAction,
}: ActionInputProps) => {
	return (
		<div className={clsx(styles.container, className)}>
			<Input
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				containerClassName={styles.inputWrapper}
			/>
			<Button size={buttonSize} title={buttonTitle} onClick={onAction}>
        {iconSrc && <img src={iconSrc} alt={iconAlt} />}
        {buttonText && <span>{buttonText}</span>}
			</Button>
		</div>
	);
};
