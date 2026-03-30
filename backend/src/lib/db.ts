import mongoose from 'mongoose';

// Подключение к БД
export const connectDB = async () => {
  try {
    const dbUri = process.env.DATABASE_URI as string;
    const conn = await mongoose.connect(dbUri);

    console.log(`БД подключена: ${conn.connection.host}`);
  } catch (err) {
    if (err instanceof Error) {
      console.log('Ошибка при подключении к БД:', err.message);
    } else {
      console.log('Неизвестная ошибка');
    }
    
    process.exit(1);
  }
};