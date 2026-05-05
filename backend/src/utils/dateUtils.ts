// Вспомогательная функция для правильных окончаний
export const getPlural = (num: number, forms: [string, string, string]) => {
	const n = Math.abs(num) % 100;
	const n1 = n % 10;

	if (n > 10 && n < 20) return forms[2];
	if (n1 > 1 && n1 < 5) return forms[1];
	if (n1 === 1) return forms[0];

	return forms[2];
};

// Функуия для перевода секунд в строку (для системного сообщения!)
export const formatCallDuration = (totalSeconds: number) => {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	if (totalSeconds < 60) {
		return `${totalSeconds} ${getPlural(totalSeconds, ['секунду', 'секунды', 'секунд'])}`;
	}

	if (minutes < 60) {
		const minStr = `${minutes} ${getPlural(minutes, ['минуту', 'минуты', 'минут'])}`;
		const secStr =
			seconds > 0
				? ` ${seconds} ${getPlural(seconds, ['секунду', 'секунды', 'секунд'])}`
				: '';
		return minStr + secStr;
	}

	const hours = Math.floor(minutes / 60);
	const remMinutes = minutes % 60;

	const hourStr = `${hours} ${getPlural(hours, ['час', 'часа', 'часов'])}`;
	const remMinStr =
		remMinutes > 0
			? ` ${remMinutes} ${getPlural(remMinutes, ['минуту', 'минуты', 'минут'])}`
			: '';

	return hourStr + remMinStr;
};