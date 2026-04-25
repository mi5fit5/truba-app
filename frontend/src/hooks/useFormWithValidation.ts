import { useState, type ChangeEvent } from 'react';

import type { TFormValidators } from '@types';

// Тип для хранения ошибок
type TErrorState<T> = {
	[key in keyof T]?: string;
};

// Кастомный хук для валидации форм
export function useFormWithValidation<T extends Record<string, string>>(
	initialValues: T,
	validators: TFormValidators<T>
) {
	// Локальные состояния для значений полей, ошибок и статуса формы
	const [inputValues, setInputValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<TErrorState<T>>({});
	const [isValid, setIsValid] = useState(false);

	// Обработчик для всех инпутов
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		const inputName = name as keyof T;

		// Проверка валидности конкретного поля
		const isValid = validators[inputName]?.validator(value) ?? true;

		// Формируем новые значения инпутов и сообщений ошибок
		const newValues = { ...inputValues, [inputName]: value };
		const newErrors = {
			...errors,
			[inputName]: !isValid ? validators[inputName]!.message : undefined,
		};

		setInputValues(newValues);
		setErrors(newErrors);

		// Проверка формы на заполненность всех полей и наличие ошибок
		const areInputsFilled = Object.values(newValues).every(
			(value) => value.trim() !== ''
		);
		const hasErrors = Object.values(newErrors).some((err) => err !== undefined);

		setIsValid(areInputsFilled && !hasErrors);
	};

	return { inputValues, handleChange, errors, isValid };
}
