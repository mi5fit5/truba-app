import axios from 'axios';

// Обработка ошибок
export const getErrorMessage = (err: unknown): string => {
	// Ошибки от сервера
	if (axios.isAxiosError(err)) {
		return err.response?.data?.message;
	}

	// Ошибки JS
	if (err instanceof Error) {
		return err.message;
	}

	return 'Произошла непредвиденная ошибка'; // Запасной вариант
};
