import React, { useState } from 'react';
import { useDispatch, useSelector } from '@store';
import { selectIsSending, sendMessage } from '@slices';
import { useMediaQuery } from '@hooks';

import { ActionInput } from '@ui';

interface MessageInputProps {
	friendId: string;
	buttonSize?: 'small' | 'medium' | 'large';
}

export const MessageInput = ({
	friendId,
	buttonSize = 'large',
}: MessageInputProps) => {
	const dispatch = useDispatch();
	const [message, setMessage] = useState('');

	const isSending = useSelector(selectIsSending);

	const isMobile = useMediaQuery('(max-width: 768px)');

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
			buttonSize={isMobile ? 'small' : buttonSize}
			buttonText={isMobile ? '⭢' : isSending ? 'отправка...' : 'отправить'}
			onAction={handleSend}
			disabled={isSending}
		/>
	);
};
