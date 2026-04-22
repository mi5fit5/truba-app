// Превращаем дату в правильный формат
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
