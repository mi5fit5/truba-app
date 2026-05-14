import { PeerProvider, SocketProvider } from '@providers';
import { ProtectedRoute } from '@navigation';
import { AppLayout } from '@components';

export const HomePage = () => {
	return (
		<ProtectedRoute>
			<SocketProvider>
				<PeerProvider>
					<AppLayout />
				</PeerProvider>
			</SocketProvider>
		</ProtectedRoute>
	);
};
