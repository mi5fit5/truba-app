import mongoose, { Schema, Document, Types } from 'mongoose';

// Типизация
export interface IUser extends Document {
	username: string; // Никнейм
	email: string; // Почта
	password: string; // Пароль
	avatar?: string; // Аватар
	friends: Types.ObjectId[]; // Массив ссылок на других пользователей
}

// Схема пользователя
const userSchema = new Schema<IUser>({
	username: {
		type: String,
		required: true,
		unique: true,
		minlength: 3,
		maxlength: 16,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
	},
	password: {
		type: String,
		required: true,
		select: false,
	},
	avatar: {
		type: String,
		default: '',
	},
	friends: [
		{
			type: Types.ObjectId,
			ref: 'User',
		},
	],
});

export default mongoose.model<IUser>('User', userSchema);
