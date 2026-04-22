import React, { useState } from 'react';
import { useDispatch } from '../../../services/store';
import { sendMessage } from '../../../services/slices/chatSlice';

import { ActionInput } from '../../ui/ActionInput';

interface MessageInputProps {
	friendId: string;
}

export const MessageInput = ({ friendId }: MessageInputProps) => {
	const dispatch = useDispatch();
	const [message, setMessage] = useState('');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMessage(e.target.value);
	};

	const handleSend = () => {
		if (!message.trim()) return;

		dispatch(sendMessage({ friendId, text: message }));
		setMessage('');
	};

	return (
		<ActionInput
			value={message}
			onChange={handleChange}
			placeholder='введите сообщение...'
			buttonTitle='Отправить сообщение'
			buttonSize='large'
			buttonText='Отправить'
			onAction={handleSend}
		/>
	);
};
