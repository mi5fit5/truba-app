import { useDispatch } from '../../services/store';
import { logoutUser } from '../../services/slices/user/userSlice';

import { Button } from '../../components/ui/Button';

export const HomePage = () => {
	const dispatch = useDispatch();

	const handleLogout = () => {
		dispatch(logoutUser());
	};

	return <Button onClick={handleLogout}>Выйти</Button>;
};
