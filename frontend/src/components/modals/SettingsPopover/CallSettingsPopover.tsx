import { useEffect, useRef, useState } from 'react';

import { Select, Slider, Text } from '@ui';

import styles from './CallSettingsPopover.module.scss';
import type { TSelectOption } from '@types';

interface CallSettingsPopoverProps {
	isOpen: boolean;
	onClose: () => void;
}

export const CallSettingsPopover = ({
	isOpen,
	onClose,
}: CallSettingsPopoverProps) => {
	const popoverRef = useRef<HTMLDivElement | null>(null);

	// Локальные стейты для хранения медиа-устройств
	const [mics, setMics] = useState<TSelectOption[]>([]);
	const [cams, setCams] = useState<TSelectOption[]>([]);

	const [selectedNoiseMode, setSelectedNoiseMode] = useState('stanard');

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

	// Запрос списка медиа-устройств у браузера
	useEffect(() => {
		if (isOpen) {
			const mediaDevices = navigator.mediaDevices.enumerateDevices();

			mediaDevices
				.then((devices) => {
					const audioDevices = devices
						.filter((device) => device.kind === 'audioinput')
						.map((mic) => ({
							value: mic.deviceId,
							label: mic.label || 'Неизвестный микрофон',
						}));

					const videoDevices = devices
						.filter((device) => device.kind === 'videoinput')
						.map((cam) => ({
							value: cam.deviceId,
							label: cam.label || 'Неизвестная камера',
						}));

					setMics(audioDevices);
					setCams(videoDevices);
				})
				.catch((err) =>
					console.error('Ошибка получения медиа-устройств:', err)
				);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	// TODO: Вынести в отдельную константу
	const noiseOptions: TSelectOption[] = [
		{ value: 'none', label: 'Отключено' },
		{ value: 'standard', label: 'Стандартное' },
		{ value: 'rnnoise', label: 'RNNoise' },
	];

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
				options={mics}
				fallbackText='микрофоны не найдены'
			/>
			<Select label='камера:' options={cams} fallbackText='Камеры не найдены' />
			<Select
				label='шумоподавление:'
				options={noiseOptions}
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
