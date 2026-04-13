import mongoose, { Schema, Document, Types } from 'mongoose';

// Типизация
export interface IFriendRequest extends Document {
	sender: Types.ObjectId; // Отправитель
	recipient: Types.ObjectId; // Получатель
	status: 'pending' | 'accepted'; // Статус запроса на дружбу
}

// Схема запроса на дружбу
const friendRequestSchema = new Schema<IFriendRequest>({
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
	status: {
		type: String,
		enum: ['pending', 'accepted'],
		default: 'pending',
	},
});

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

export default FriendRequest;
