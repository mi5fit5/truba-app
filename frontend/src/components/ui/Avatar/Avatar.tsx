import { clsx } from 'clsx';
import styles from './Avatar.module.scss';

interface AvatarProps {
	src: string;
	name: string;
	size?: 'large' | 'medium';
	className?: string;
}

export const Avatar = ({
	src,
	name,
	size = 'large',
	className,
}: AvatarProps) => {
	return (
		<div className={clsx(styles.avatarWrapper, styles[size], className)}>
			<img src={src} alt={`Аватар ${name}`} className={styles.image} />
		</div>
	);
};
