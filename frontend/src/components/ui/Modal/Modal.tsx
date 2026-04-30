import { memo, useEffect, type FC, type ReactNode } from 'react';
import ReactDOM from 'react-dom';

import styles from './Modal.module.scss';

interface ModalProps {
	onClose: () => void;
	children: ReactNode;
}

const modalRoot = document.getElementById('modals');

export const Modal: FC<ModalProps> = memo(({ onClose, children }) => {
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && onClose) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEsc);

		return () => {
			document.removeEventListener('keydown', handleEsc);
		};
	}, [onClose]);

	return ReactDOM.createPortal(
		<div className={styles.overlay}>
			<div className={styles.backdrop} />

			<div className={styles.contentWrapper}>{children}</div>
		</div>,
		modalRoot as HTMLDivElement
	);
});

Modal.displayName = 'Modal';
