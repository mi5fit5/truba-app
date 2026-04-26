// Проверка совпадения дат
export const isSameDate = (date1: string, date2: string) => {
	const d1 = new Date(date1);
	const d2 = new Date(date2);

	return (
		d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate()
	);
};

// Форматирование даты для сообщения
export const formatMessageDate = (isoString: string) => {
	const date = new Date(isoString);

	// День, месяц, год
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();

	// Часы, минуты
	const hours = String(date.getHours()).padStart(2, '0');
	const mins = String(date.getMinutes()).padStart(2, '0');

	return `${day}.${month}.${year} ${hours}:${mins}`;
};

// Формат даты для разделителя в чате
export const formatSeparatorDate = (isoString: string) => {
	const date = new Date(isoString);
	const today = new Date();

	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	const nativeDateString = date.toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	return nativeDateString;
};
