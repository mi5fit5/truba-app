import mongoose from 'mongoose';
import User from '../models/User';

// Тестирование работы базы данных
describe('Database logic', () => {
	beforeAll(async () => {
		// Подключаемся к тестовой базе
		await mongoose.connect(
			process.env.DATABASE_URI_TEST || 'mongodb://localhost:27017/truba_test_db'
		);
	});

	afterEach(async () => {
		// Очищаем коллекцию после каждого теста
		await User.deleteMany({});
	});

	// Тест 1: Проверка создания пользователя со всеми обязательными полями
	test('should successfully create a user with all required fields', async () => {
		const validUser = new User({
			username: 'testUser',
			email: 'test@example.com',
			password: 'test123',
		});

		const savedUser = await validUser.save();

		expect(savedUser._id).toBeDefined();
		expect(savedUser.username).toBe('testUser');
		expect(savedUser.email).toBe('test@example.com');
	});

	// Тест 2: Проверка валидации при отсутствии обязательного поля email
	test('should throw a validation error when email is missing', async () => {
		const userWithoutEmail = new User({
			username: 'testUser',
			password: 'test123',
		});

		await expect(userWithoutEmail.save()).rejects.toThrow(
			mongoose.Error.ValidationError
		);
	});

	afterAll(async () => {
		// Очистка и закрытие тестовой БД
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
	});
});
