import mongoose, { Document, Schema, Types } from 'mongoose';

// Типизация
export interface IMessage extends Document {
	sender: Types.ObjectId; // Отправитель
	recipient: Types.ObjectId; // Получатель
	text: string; // Текст сообщения
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
	},
	{
		timestamps: true,
	}
);

export default mongoose.model<IMessage>('Message', messageSchema);
