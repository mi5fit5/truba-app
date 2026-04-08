import type { ReactNode } from 'react';

import styles from './WindowFooter.module.scss';

export const WindowFooter = ({ children }: { children: ReactNode }) => {
	return <div className={styles.footer}>{children}</div>;
};
