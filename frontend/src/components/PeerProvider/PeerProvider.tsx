import { PeerContext } from '../../contexts';
import { usePeerConnection } from '@hooks';
import { IncomingCallModal } from '@modals';
import type React from 'react';

interface PeerProviderProps {
	children: React.ReactNode;
}

export const PeerProvider = ({ children }: PeerProviderProps) => {
	const peerConnection = usePeerConnection();

	return (
		<PeerContext.Provider value={peerConnection}>
			{children}
			<IncomingCallModal
				onAccept={peerConnection.callFromFriend}
				onReject={peerConnection.completeCall}
			/>
		</PeerContext.Provider>
	);
};
