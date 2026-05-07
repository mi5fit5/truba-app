import { type InputHTMLAttributes, useId } from 'react';
import clsx from 'clsx';

import styles from './Slider.module.scss';

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	containerClassName?: string;
}

export const Slider = ({
	label,
	className,
	containerClassName,
	id,
	...props
}: SliderProps) => {
	const generatedId = useId();
	const sliderId = id || generatedId;

	return (
		<div className={clsx(styles.wrapper, containerClassName)}>
			{label && (
				<label className={styles.label} htmlFor={sliderId}>
					{label}
				</label>
			)}
			<input
				id={sliderId}
				type='range'
				className={clsx(styles.slider, className)}
				{...props}
			/>
		</div>
	);
};
