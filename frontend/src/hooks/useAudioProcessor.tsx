import { useCallback, useRef } from 'react';

export const useAudioProcessor = () => {
	const audioContextRef = useRef<AudioContext | null>(null);
	const workletNodeRef = useRef<AudioWorkletNode | null>(null);
	const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(
		null
	);

	// Запуск шумоподавления
	const startNoiseSuppression = useCallback(async (rawStream: MediaStream) => {
		try {
			// Создание аудио-контекста
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext; // Поддержка браузеров на движке WebKit
			const audioContext = new AudioContextClass({ sampleRate: 48000 });
			audioContextRef.current = audioContext;

			// Скачивание WASM-файла и превращение его в байты
			const wasmResponce = await fetch(
				`${window.location.origin}/rnnoise/rnnoise.wasm`
			);
			const wasmBinary = await wasmResponce.arrayBuffer();

			// Подключаем процессор к браузеру
			await audioContext.audioWorklet.addModule(
				`${window.location.origin}/rnnoise/rnnoise-processor.js`
			);

			// Сырой звук с микрофона превращаем его в аудио-узеел
			const sourceNode = audioContext.createMediaStreamSource(rawStream);
			sourceNodeRef.current = sourceNode;

			// Фильтр низких частот
			const highpassFilter = audioContext.createBiquadFilter();
			highpassFilter.type = 'highpass';
			highpassFilter.frequency.value = 100;

			// Создаем узел нейросети и передаем ему скачанные байты
			const workletNode = new AudioWorkletNode(
				audioContext,
				'rnnoise-processor',
				{
					processorOptions: {
						wasmBinary: wasmBinary, // Передаем байты внутрь изолированного потока
					},
				}
			);
			workletNodeRef.current = workletNode;

			// Уменьшаем громкость выходного сигнала
			const outputGain = audioContext.createGain();
			outputGain.gain.value = 0.9;

			// Получаем очищенный звук
			const destinationNode = audioContext.createMediaStreamDestination();
			destinationNodeRef.current = destinationNode;

			// Соединяем все узлы между друг другом
			sourceNode.connect(highpassFilter);
			highpassFilter.connect(workletNode);
			workletNode.connect(outputGain);
			outputGain.connect(destinationNode);

			// Извлекаем очищенный звук и возвращаем его
			return destinationNode.stream.getAudioTracks()[0];
		} catch (err: unknown) {
			console.error('Ошибка инициализации аудио-графа:', err);
			return null;
		}
	}, []);

	// Выключение шумоподавления
	const stopNoiseSuppression = useCallback(() => {
		// Отключаем узлы друг от друга
		if (workletNodeRef.current) {
			workletNodeRef.current.port.postMessage({ type: 'destroy' });
			workletNodeRef.current.disconnect();
		}
		if (sourceNodeRef.current) sourceNodeRef.current.disconnect();

		// Закрываем аудио-контекст
		if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
			audioContextRef.current.close();
		}

		// Очищаем рефы
		workletNodeRef.current = null;
		sourceNodeRef.current = null;
		audioContextRef.current = null;
		destinationNodeRef.current = null;
	}, []);

	return { startNoiseSuppression, stopNoiseSuppression };
};
