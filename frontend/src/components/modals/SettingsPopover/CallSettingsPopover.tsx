import { useEffect, useRef } from 'react';

import type { TCallStatus, TNoiseMode } from '@types';
import { NOISE_OPTIONS } from '@constants';
import { usePeerContext } from '@context';

import { Select, Slider, Text } from '@ui';

import styles from './CallSettingsPopover.module.scss';

interface CallSettingsPopoverProps {
	isOpen: boolean;
	onClose: () => void;
	callStatus: TCallStatus;
	remoteVolume: number;
	onRemoteVolumeChange: (value: number) => void;
	selectedNoiseMode: TNoiseMode;
	onNoiseModeChange: (mode: TNoiseMode) => void;
}

export const CallSettingsPopover = ({
	isOpen,
	callStatus,
	remoteVolume,
	selectedNoiseMode,
	onClose,
	onRemoteVolumeChange,
	onNoiseModeChange,
}: CallSettingsPopoverProps) => {
	const {
		availableMics,
		availableCams,
		selectedMic,
		selectedCam,
		switchDevice,
	} = usePeerContext();

	const popoverRef = useRef<HTMLDivElement | null>(null);

	const isConnecting = callStatus !== 'connected';

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
				onChange={(e) =>
					switchDevice('audio', e.target.value, selectedNoiseMode)
				}
				fallbackText='микрофоны не найдены'
				disabled={isConnecting}
			/>
			<Select
				label='камера:'
				options={availableCams}
				value={selectedCam}
				onChange={(e) =>
					switchDevice('video', e.target.value, selectedNoiseMode)
				}
				fallbackText='Камеры не найдены'
				disabled={isConnecting}
			/>
			<Select
				label='шумоподавление:'
				options={NOISE_OPTIONS}
				value={selectedNoiseMode}
				onChange={(e) => onNoiseModeChange(e.target.value as TNoiseMode)}
			/>
			<Slider
				label='громкость собеседника:'
				min='0'
				max='100'
				value={remoteVolume}
				onChange={(e) => onRemoteVolumeChange(Number(e.target.value))}
			/>
		</div>
	);
};
