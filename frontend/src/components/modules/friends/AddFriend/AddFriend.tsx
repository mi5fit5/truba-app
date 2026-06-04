import { useState } from 'react';
import { useDispatch, useSelector } from '@store';
import { selectIsActionLoading, sendFriendRequest } from '@slices';

import { DialogModal } from '@modals';
import { ActionInput } from '@ui';

import { addFriendIcon } from '@icons';

export const AddFriend = () => {
	const dispatch = useDispatch();
	const [username, setUsername] = useState('');

	const [modalConfig, setModalConfig] = useState<{
		isOpen: boolean;
		type: 'success' | 'warning';
		message: string;
	}>({
		isOpen: false,
		type: 'success',
		message: '',
	});

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
			setModalConfig({
				isOpen: true,
				type: 'success',
				message: 'Заявка в друзья успешно отправлена!',
			});
		} else if (sendFriendRequest.rejected.match(resultAction)) {
			setModalConfig({
				isOpen: true,
				type: 'warning',
				message:
					(resultAction.payload as string) || 'Не удалось отправить заявку',
			});
		}
	};

	const closeModal = () => {
		setModalConfig((prev) => ({ ...prev, isOpen: false }));
	};

	return (
		<>
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

			<DialogModal
				isOpen={modalConfig.isOpen}
				type={modalConfig.type}
				title={
					modalConfig.type === 'success'
						? 'успех - тРУба.exe'
						: 'ошибка - тРУба.exe'
				}
				message={modalConfig.message}
				cancelText='закрыть'
				onClose={closeModal}
			/>
		</>
	);
};
