import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server';

// Тестирование защищённых процессов
describe('REST API routes protection', () => {
	let authCookie: string[];

	beforeAll(async () => {
		// Подключение к тестовой БД
		await mongoose.connect(
			process.env.DATABASE_URI_TEST || 'mongodb://localhost:27017/truba_test_db'
		);

		await mongoose.connection.collection('users').deleteMany({});

		// Авторизация под тестовым пользщователем до запуска проверок
		const response = await request(app).post('/api/auth/register').send({
			username: 'testUser',
			email: 'test@test.com',
			password: 'test123',
		});

		const cookies = response.headers['set-cookie'];
		authCookie = Array.isArray(cookies) ? cookies : [cookies as string];
	});

	// Тест 1: Попытка перехода на защищенный маршрут БЕЗ куки
	test('should block access without Cookie', async () => {
		const response = await request(app).get('/api/users/me');

		expect(response.status).toBe(401);
		expect(response.body.message).toBe('Похоже, что у вас нет доступа');
	});

	// Тест 2: Попытка перехода на защищенный маршрут с НЕвалидным куки
	test('should block access with invalid cookie', async () => {
		const response = await request(app)
			.get('/api/users/me')
			.set('Cookie', ['jwt=invalid_token']);

		expect(response.status).toBe(401);
		expect(response.body.message).toBe('Неверный токен');
	});

	// Тест 3: Попытка перехода на защищенный маршрут С валидным куки
	test('should grant access with valid token', async () => {
		const response = await request(app)
			.get('/api/users/me')
			.set('Cookie', authCookie);

		expect(response.status).toBe(200);
		expect(response.body.user).toBeDefined();
		expect(response.body.user.email).toBe('test@test.com');
	});

	afterAll(async () => {
		// Очистка и закрытие тестовой БД
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
	});
});
