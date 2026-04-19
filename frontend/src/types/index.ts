export type TLoginData = {
	email: string;
	password: string;
};

export type TRegisterData = {
	username: string;
	email: string;
	password: string;
};

// Тип пользователя
export type TUser = {
	_id: string;
	username: string;
	email: string;
	avatar: string;
	friends: string[];
};

// Тип друга
export type TFriend = Omit<TUser, 'friends'>;

// Тип для входящего запроса дружбы
export type TFriendRequest = {
	_id: string;
	sender: TFriend;
	recipient: string;
	status: 'pending' | 'accepted';
};

// Тип для сообщения в чате
export type TMessage = {
	_id: string;
	sender: string;
	recipient: string;
	text: string;
	createdAt: string;
	updatedAt: string;
};

// Тип для любых объектов валидации
export type TFormValidators<T> = {
	[key in keyof T]: {
		validator: (value: string) => boolean;
		message: string;
	};
};
