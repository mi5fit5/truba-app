/* eslint-disable no-useless-escape */

import type {
	TChangePasswordForm,
	TFormValidators,
	TLoginData,
	TRegisterData,
	TUpdateProfileData,
} from '@types';

// Регулярные выражения
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
export const PWD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+{}[\]:;<>,.?~\\/-]{6,}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

export const URL_REGEX =
	/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

// Логика проверки и сообщения об ошибке
const usernameValidator = {
	validator: (value: string) => USERNAME_REGEX.test(value),
	message: 'От 3 до 20 символов. Разрешены латиница, цифры и "_".',
};

const emailValidator = {
	validator: (value: string) => EMAIL_REGEX.test(value),
	message: 'Разрешены латиница, цифры, ".", "_", "-".',
};

const passwordValidator = {
	validator: (value: string) => PWD_REGEX.test(value),
	message: 'Мин. 6 символов. Разрешены латиница, цифры и спецсимволы.',
};

const urlValidator = {
	validator: (value: string) => value === '' || URL_REGEX.test(value),
	message: 'Введите корректную ссылку',
};

const bioValidator = {
	validator: (value: string) => value.length <= 160,
	message: 'Макс. 160 символов',
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

// Конструктор для формы обновления профиля
export const profileValidators: TFormValidators<TUpdateProfileData> = {
	avatar: urlValidator,
	bio: bioValidator,
};

// Конструктор для формы смены пароля
export const changePasswordValidators: TFormValidators<TChangePasswordForm> = {
	oldPassword: passwordValidator,
	newPassword: passwordValidator,
	confirmPassword: passwordValidator,
};
