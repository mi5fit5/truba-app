import type { TFormValidators, TLoginData, TRegisterData } from '../types';

// Регулярные выражения
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
export const PWD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+{}[\]:;<>,.?~\\/-]{6,}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

// Логика проверки и сообщения об ошибке
const usernameValidator = {
	validator: (value: string) => USERNAME_REGEX.test(value),
	message: 'От 3 до 20 символов. Разрешены латиница, цифры и "_"',
};

const emailValidator = {
	validator: (value: string) => EMAIL_REGEX.test(value),
	message:
		'Формат - "name@domain.com". Разрешены латиница, цифры, ".", "_", "-"',
};

const passwordValidator = {
	validator: (value: string) => PWD_REGEX.test(value),
	message: 'Мин. 6 символов. Разрешены латиница, цифры и спецсимволы',
};

// Конструкторы для форм входа и регистрации
export const loginValidators: TFormValidators<TLoginData> = {
	email: emailValidator,
	password: passwordValidator,
};

export const registerValidators: TFormValidators<TRegisterData> = {
	username: usernameValidator,
	email: emailValidator,
	password: passwordValidator,
};
