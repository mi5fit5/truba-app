import createRNNWasmModule from './rnnoise.js';

const FRAME_SIZE = 480;

// Определяем класс для работы с нейросетью
class RNNoiseProcessor extends AudioWorkletProcessor {
	constructor(options) {
		super();
		this.model = null;
		this.rnnoiseState = null;
		this.wasmHeapPointer = null;

		this.inputBuffer = new Float32Array(FRAME_SIZE * 2);
		this.outputBuffer = new Float32Array(FRAME_SIZE * 2);
		this.inputOffset = 0;
		this.outputOffset = 0;

		const wasmBinary = options.processorOptions.wasmBinary;

		// Инициализация WASM
		createRNNWasmModule({
			wasmBinary: wasmBinary,
		})
			.then((module) => {
				this.model = module;
				this.rnnoiseState = this.model._rnnoise_create(); // Инстанс нейросети
				this.wasmHeapPointer = this.model._malloc(FRAME_SIZE * 4); // Выделяем память в WASM
			})
			.catch((err) => {
				console.error('Ошибка загрузки WASM модуля:', err);
			});
	}

	process(inputs, outputs) {
		const input = inputs[0];
		const output = outputs[0];

		// Прерываем, если нет активного аудиопотока
		if (!input || !input[0] || !output || !output[0]) return true;

		const inChannel = input[0];
		const outChannel = output[0];
		const workletSize = inChannel.length;

		// Пропускаем оригинальный звук, если нейросеть еще не загрузилась
		if (!this.model || !this.rnnoiseState) {
			outChannel.set(inChannel);
			return true;
		}

		this.inputBuffer.set(inChannel, this.inputOffset);
		this.inputOffset += workletSize;

		// При достаточном накоплении данных для нейросети
		if (this.inputOffset >= FRAME_SIZE) {
			const frameToProcess = this.inputBuffer.subarray(0, FRAME_SIZE);

			// Копируем данные из JS-буфера в выделенную память WASM
			const heapIndex = this.wasmHeapPointer / 4;
			this.model.HEAPF32.set(frameToProcess, heapIndex);

			// Очищение звука
			this.model._rnnoise_process_frame(
				this.rnnoiseState,
				this.wasmHeapPointer,
				this.wasmHeapPointer
			);

			// Возвращаем очищенный звук и кладем его в буфер вывода
			const cleanFrame = this.model.HEAPF32.subarray(
				heapIndex,
				heapIndex + FRAME_SIZE
			);
			this.outputBuffer.set(cleanFrame, this.outputOffset);
			this.outputOffset += FRAME_SIZE;

			// И оставшиеся необработанные семплы сдвигаем в начало входного буфера
			this.inputBuffer.copyWithin(0, FRAME_SIZE, this.inputOffset);
			this.inputOffset -= FRAME_SIZE;
		}

		// Отдаем готовые семплу браузеру для воспроизведения
		if (this.outputOffset >= workletSize) {
			outChannel.set(this.outputBuffer.subarray(0, workletSize));

			// Сдвигаем выходной буфер
			this.outputBuffer.copyWithin(0, workletSize, this.outputOffset);
			this.outputOffset -= workletSize;
		} else {
			outChannel.fill(0); // Отдаем тишину при задержки
		}

		return true;
	}
}

registerProcessor('rnnoise-processor', RNNoiseProcessor);
