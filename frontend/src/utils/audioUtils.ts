// Воспроизведение системных звуков
export const playSystemSound = async (
	soundPath: string,
	loop = false,
	volume = 0.4
) => {
	const audio = new Audio(soundPath);
	audio.volume = volume;
	audio.loop = loop;

	// Достаем выбранные наушники
	const savedSpeaker = localStorage.getItem('voice_chat_selected_speaker');

	if (savedSpeaker && typeof audio.setSinkId === 'function') {
		try {
			await audio.setSinkId(savedSpeaker);
		} catch (err) {
			console.error('Ошибка направления системного звука на устройство:', err);
		}
	}

	audio.play().catch(console.warn);

	return audio;
};
