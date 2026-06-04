import clsx from 'clsx';
import { Button, Modal, Text, Window } from '@ui';
import { acceptIcon, notFoundIcon, warningIcon } from '@icons';
import styles from './DialogModal.module.scss';

interface DialogModalProps {
	isOpen: boolean;
	type: 'warning' | 'success';
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onClose: () => void;
	onConfirm?: () => void;
}

export const DialogModal = ({
	isOpen,
	type,
	title,
	message,
	confirmText,
	cancelText,
	onClose,
	onConfirm,
}: DialogModalProps) => {
	if (!isOpen) return null;

	return (
		<Modal onClose={onClose}>
			<Window
				title={title}
				icon={<img src={notFoundIcon} alt='Иконка в виде пустого окна' />}
				className={styles.dialogWindow}
				bodyClassName={styles.dialogBody}>
				<div className={styles.content}>
					<img
						src={type === 'warning' ? warningIcon : acceptIcon}
						alt={type}
						className={styles.icon}
					/>
					<Text as='p' size={22} align='center'>
						{message}
					</Text>
				</div>

				<div
					className={clsx(
						styles.actions,
						(type === 'success' || !onConfirm) && styles.singleButton
					)}>
					{type === 'warning' && onConfirm && (
						<>
							<Button size='medium' onClick={onConfirm} variant='red'>
								{confirmText}
							</Button>
							<Button size='medium' onClick={onClose}>
								{cancelText}
							</Button>
						</>
					)}

					{type === 'warning' && !onConfirm && (
						<Button size='medium' onClick={onClose}>
							{cancelText || 'закрыть'}
						</Button>
					)}

					{type === 'success' && (
						<Button size='medium' onClick={onClose}>
							{cancelText || 'закрыть'}
						</Button>
					)}
				</div>
			</Window>
		</Modal>
	);
};
