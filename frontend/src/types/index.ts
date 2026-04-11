export type TLoginData = {
	email: string;
	password: string;
};

export type TRegisterData = {
	username: string;
	email: string;
	password: string;
};

export type TUser = {
	_id: string;
	username: string;
	email: string;
	avatar: string;
	friends: string[];
};

// Тип для любых объектов валидации
export type TFormValidators<T> = {
	[key in keyof T]: {
		validator: (value: string) => boolean;
		message: string;
	};
};
