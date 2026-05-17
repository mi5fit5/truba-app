import type { SignalData } from 'simple-peer';

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
	bio: string;
	friends: string[];
	steamId?: string;
};

// Тип для профиля Steam
export type TSteamProfile = {
	steamName: string;
	profileUrl: string;
	avatar: string;
	onlineState: number;
	currentGame?: string;
};

// Тип смены пароля
export type TChangePasswordData = {
	oldPassword: string;
	newPassword: string;
};

// Тип для формы смены пароля
export type TChangePasswordForm = TChangePasswordData & {
	confirmPassword: string;
};

// Тип для обновления профиля пользователя (аватар или био)
export type TUpdateProfileData = {
	avatar?: string;
	bio?: string;
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
	type?: 'text' | 'system';
	createdAt: string;
	updatedAt: string;
};

// Тип собеседника в звонке
export type TParticipant = Pick<TFriend, '_id' | 'username' | 'avatar'>;

// Тип для статуса звонка
export type TCallStatus = 'idle' | 'calling' | 'receiving' | 'connected';

// Тип самого звонка
export type TCallType = 'audio' | 'video';

// Тип входящего звонка
export type TIncomingCall = {
	from: TParticipant;
	signal: SignalData;
	callType: TCallType;
	mediaState: {
		micMuted: boolean;
		camMuted: boolean;
	};
};

// Тип для любых объектов валидации
export type TFormValidators<T> = {
	[key in keyof T]: {
		validator: (value: string) => boolean;
		message: string;
	};
};

// Тип для селекта
export type TSelectOption = {
	value: string | number;
	label: string;
};

// Тип для режимов шумоподавления
export type TNoiseMode = 'none' | 'standard' | 'rnnoise';

// Тип вкладок модалки настроек
export type TUserSettingsTab = 'profile' | 'security' | 'audio' | 'integration';
