import { clsx } from 'clsx';

import styles from './Avatar.module.scss';
import { defaultAvatar } from '@images';

interface AvatarProps {
	src?: string;
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
			{src && src.trim() !== '' ? (
				<img src={src} alt={`Аватар ${name}`} />
			) : (
				<img src={defaultAvatar} alt={`Аватар ${name}`} />
			)}
		</div>
	);
};
