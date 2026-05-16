import { useEffect, useRef } from 'react';

import type { TCallStatus, TNoiseMode } from '@types';
import { NOISE_OPTIONS } from '@constants';
import { usePeerContext } from '@context';

import { Select, Slider, Text } from '@ui';

import styles from './CallSettingsPopover.module.scss';

interface CallSettingsPopoverProps {
	isOpen: boolean;
	callStatus: TCallStatus;
	remoteVolume: number;
	isCamMuted: boolean;
	onClose: () => void;
	onRemoteVolumeChange: (value: number) => void;
}

export const CallSettingsPopover = ({
	isOpen,
	callStatus,
	remoteVolume,
	isCamMuted,
	onClose,
	onRemoteVolumeChange,
}: CallSettingsPopoverProps) => {
	const {
		availableMics,
		availableCams,
		availableSpeakers,
		selectedMic,
		selectedCam,
		selectedSpeaker,
		noiseMode,
		applyNoiseMode,
		switchDevice,
		switchSpeaker,
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
				onChange={(e) => switchDevice('audio', e.target.value, noiseMode)}
				fallbackText='микрофоны не найдены'
				disabled={isConnecting}
			/>
			<Select
				label='динамики:'
				options={availableSpeakers}
				value={selectedSpeaker}
				onChange={(e) => switchSpeaker(e.target.value)}
				fallbackText='динамики не найдены'
				disabled={isConnecting}
			/>
			<Select
				label='камера:'
				options={availableCams}
				value={selectedCam}
				onChange={(e) => switchDevice('video', e.target.value, noiseMode)}
				fallbackText='Камеры не найдены'
				disabled={isConnecting || isCamMuted}
			/>
			<Select
				label='шумоподавление:'
				options={NOISE_OPTIONS}
				value={noiseMode}
				onChange={(e) => applyNoiseMode(e.target.value as TNoiseMode)}
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
