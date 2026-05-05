import type React from 'react';

import { PeerContext } from '@context';
import { usePeerConnection } from '@hooks';
import { ActiveCallModal, IncomingCallModal } from '@modals';

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
			<ActiveCallModal onEndCall={peerConnection.completeCall} />
		</PeerContext.Provider>
	);
};
