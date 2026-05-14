import { type TextareaHTMLAttributes, useId } from 'react';
import { clsx } from 'clsx';

import styles from './TextArea.module.scss';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
	containerClassName?: string;
}

export const TextArea = ({
	label,
	className,
	containerClassName,
	id,
	...rest
}: TextAreaProps) => {
	const generatedId = useId();
	const textAreaId = id || generatedId;

	return (
		<div className={clsx(styles.fieldGroup, containerClassName)}>
			{label && (
				<label className={styles.label} htmlFor={textAreaId}>
					{label}
				</label>
			)}
			<textarea
				id={textAreaId}
				className={clsx(styles.textArea, className)}
				{...rest}
			/>
		</div>
	);
};
