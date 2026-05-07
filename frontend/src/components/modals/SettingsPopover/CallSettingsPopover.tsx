import { useEffect, useRef, useState } from 'react';

import { Select, Slider, Text } from '@ui';

import styles from './CallSettingsPopover.module.scss';
import type { TSelectOption } from '@types';
import { NOISE_OPTIONS } from '@constants';

interface CallSettingsPopoverProps {
	isOpen: boolean;
	onClose: () => void;
	onSwitchDevice: (type: 'audio' | 'video', deviceId: string) => void;
	availableMics: TSelectOption[];
	availableCams: TSelectOption[];
	selectedMic: string;
	selectedCam: string;
}

export const CallSettingsPopover = ({
	isOpen,
	onClose,
	onSwitchDevice,
	availableMics,
	availableCams,
	selectedMic,
	selectedCam,
}: CallSettingsPopoverProps) => {
	const popoverRef = useRef<HTMLDivElement | null>(null);

	const [selectedNoiseMode, setSelectedNoiseMode] = useState('standard');

	// Закрытие по клику вне поповера
	useEffect(() => {
		const settingsButton = document.getElementById('settings-button');

		const handleClickOutside = (e: MouseEvent) => {
			if (
				popoverRef.current &&
				!popoverRef.current.contains(e.target as Node) &&
				(!settingsButton || !settingsButton.contains(e.target as Node))
			) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className={styles.popoverWrapper}
			ref={popoverRef}
			onClick={(e) => e.stopPropagation()}
			onMouseDown={(e) => e.stopPropagation()}>
			<Text as='h3' size={30} align='left' lowercase>
				настройки звонка
			</Text>
			<Select
				label='микрофон:'
				options={availableMics}
				value={selectedMic}
				onChange={(e) => onSwitchDevice('audio', e.target.value)}
				fallbackText='микрофоны не найдены'
			/>
			<Select
				label='камера:'
				options={availableCams}
				value={selectedCam}
				onChange={(e) => onSwitchDevice('video', e.target.value)}
				fallbackText='Камеры не найдены'
			/>
			<Select
				label='шумоподавление:'
				options={NOISE_OPTIONS}
				value={selectedNoiseMode}
				onChange={(e) => setSelectedNoiseMode(e.target.value)}
			/>
			<Slider label='моя громкость:' min='0' max='100' defaultValue='100' />
			<Slider
				label='громкость собеседника:'
				min='0'
				max='100'
				defaultValue='100'
			/>
		</div>
	);
};
