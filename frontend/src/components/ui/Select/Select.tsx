import { type SelectHTMLAttributes, useId } from 'react';
import clsx from 'clsx';
import type { TSelectOption } from '@types';

import styles from './Select.module.scss';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	options: TSelectOption[];
	label?: string;
	fallbackText?: string;
	containerClassName?: string;
}

export const Select = ({
	options,
	label,
	fallbackText = 'нет вариантов...',
	className,
	containerClassName,
	id,
	...props
}: SelectProps) => {
	const generatedId = useId();
	const selectId = id || generatedId;

	return (
		<div className={clsx(styles.wrapper, containerClassName)}>
			{label && (
				<label className={styles.label} htmlFor={selectId}>
					{label}
				</label>
			)}
			<div className={styles.selectContainer}>
				<select
					id={selectId}
					className={clsx(styles.select, className)}
					disabled={options.length === 0 || props.disabled}
					{...props}>
					{options.length > 0 ? (
						options.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))
					) : (
						<option disabled value=''>
							{fallbackText}
						</option>
					)}
				</select>
				<span className={styles.dropdownButton} aria-hidden='true' />
			</div>
		</div>
	);
};
