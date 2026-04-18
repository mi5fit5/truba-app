import type React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';

import styles from './ActionInput.module.scss';

interface ActionInputProps {
	value: string;
	placeholder?: string;
	iconSrc: string;
	iconAlt?: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onAction?: () => void;
}

export const ActionInput = ({
	value,
	placeholder,
	iconSrc,
	iconAlt,
	onChange,
	onAction,
}: ActionInputProps) => {
	return (
		<div className={styles.container}>
			<Input
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				containerClassName={styles.inputWrapper}
			/>
			<Button size='small' onClick={onAction}>
				<img src={iconSrc} alt={iconAlt} />
			</Button>
		</div>
	);
};
