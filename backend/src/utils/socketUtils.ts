// Создание уникального ключа для активного звонка из id пользователей
export function getCallKey(firstUserId: string, secondUserId: string) {
	if (!firstUserId || !secondUserId) return '';

	return [firstUserId.toString(), secondUserId.toString()].sort().join('-');
}
