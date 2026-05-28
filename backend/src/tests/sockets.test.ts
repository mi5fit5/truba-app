import mongoose from 'mongoose';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { server } from '../lib/socket';
import User from '../models/User';

// Тестирование сигнального сокет-сервера
describe('WebRTC signaling WebSocket server', () => {
	let clientA: ClientSocket;
	let clientB: ClientSocket;
	let userAId: string;
	let userBId: string;
	const port = 3001;

	beforeAll(async () => {
		await mongoose.connect(
			process.env.DATABASE_URI_TEST || 'mongodb://localhost:27017/truba_test_db'
		);

		// Инициатор
		const userA = await User.create({
			username: 'sender',
			email: 'sender@test.com',
			password: 'test123',
		});

		// Получатель
		const userB = await User.create({
			username: 'receiver',
			email: 'receiver@test.com',
			password: 'test123',
		});

		userAId = userA._id.toString();
		userBId = userB._id.toString();

		await new Promise<void>((resolve) => {
			server.listen(port, () => resolve());
		});
	});

	afterEach(() => {
		if (clientA) clientA.close();
		if (clientB) clientB.close();
	});

	// Тест: Проверка маршрутизации звонка сервером от инициатора к получателю
	test('should route call correctly', (done) => {
		clientA = Client(`http://localhost:${port}`, {
			query: { userId: userAId },
		});
		clientB = Client(`http://localhost:${port}`, {
			query: { userId: userBId },
		});

		clientB.on('incomingCall', (data) => {
			expect(data.from._id).toBe(userAId);
			expect(data.from.username).toBe('sender');
			expect(data.signal.type).toBe('offer');
			expect(data.mediaState.camMuted).toBe(true);
			done();
		});

		clientA.on('connect', () => {
			clientB.on('connect', () => {
				clientA.emit('callToParticipant', {
					userToCall: userBId,
					signalData: { type: 'offer', sdp: 'fake_sdp' },
					callType: 'audio',
					mediaState: { micMuted: false, camMuted: true },
				});
			});
		});
	});

	// Очищаем БД; закрываем сервер
	afterAll(async () => {
		await User.deleteMany({});
		await mongoose.connection.close();
		server.close();
	});
});
