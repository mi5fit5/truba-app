import mongoose, { Document, Schema, Types } from 'mongoose';

// Типизация
export interface IMessage extends Document {
	sender: Types.ObjectId; // Отправитель
	recipient: Types.ObjectId; // Получатель
	text: string; // Текст сообщения
	type: 'text' | 'system' | 'invite'; // Тип сообщения
	gameData?: {
		// Данные игры Steam
		gameName: string;
		appId: string;
		lobbyId: string | null;
		gameAvatarUrl: string | null;
	};
	createdAt: Date; // Дата и время создания
	updatedAt: Date; // Дата и время обновления
}

// Схема сообщения
const messageSchema = new Schema<IMessage>(
	{
		sender: {
			type: Types.ObjectId,
			ref: 'User',
			required: true,
		},
		recipient: {
			type: Types.ObjectId,
			ref: 'User',
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			enum: ['text', 'system', 'invite'],
			default: 'text',
		},
		gameData: {
			gameName: { type: String },
			appId: { type: String },
			lobbyId: { type: String, default: null },
			gameAvatarUrl: { type: String, default: null },
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<IMessage>('Message', messageSchema);
