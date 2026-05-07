// Функция для уменьшения размера текста для вариантов в выпадающих списках
export const truncateOptionsText = (text: string, maxLength: number = 38) => {
	return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};
