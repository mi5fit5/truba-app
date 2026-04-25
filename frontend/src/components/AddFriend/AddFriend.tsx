import { useState } from 'react';
import { useDispatch, useSelector } from '@store';
import { selectIsActionLoading, sendFriendRequest } from '@slices';

import { ActionInput } from '@ui';

import { addFriendIcon } from '@icons';

export const AddFriend = () => {
	const dispatch = useDispatch();
	const [username, setUsername] = useState('');

	const isActionLoading = useSelector(selectIsActionLoading);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUsername(e.target.value);
	};

	const handleAdd = async () => {
		const cleanedUsername = username.trim();

		if (!cleanedUsername || isActionLoading) return;

		const resultAction = await dispatch(sendFriendRequest(cleanedUsername));

		if (sendFriendRequest.fulfilled.match(resultAction)) {
			setUsername('');
		}
	};

	return (
		<ActionInput
			value={username}
			onChange={handleChange}
			placeholder={isActionLoading ? 'отправка...' : 'добавить...'}
			iconSrc={addFriendIcon}
			iconAlt='Иконка отправки запроса дружбы: Земля и люди'
			buttonTitle='Отправить запрос дружбы'
			buttonSize='small'
			onAction={handleAdd}
		/>
	);
};
