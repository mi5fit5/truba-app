import React, { useState } from 'react';
import { useDispatch, useSelector } from '@store';
import { selectIsSending, sendMessage } from '@slices';

import { ActionInput } from '@ui';

interface MessageInputProps {
	friendId: string;
}

export const MessageInput = ({ friendId }: MessageInputProps) => {
	const dispatch = useDispatch();
	const [message, setMessage] = useState('');

	const isSending = useSelector(selectIsSending);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMessage(e.target.value);
	};

	const handleSend = () => {
		if (!message.trim() || isSending) return;

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
			buttonText={isSending ? 'отправка...' : 'отправить'}
			onAction={handleSend}
			disabled={isSending}
		/>
	);
};
