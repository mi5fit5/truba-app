import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDB } from './lib/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

connectDB().then(() => {
	app.listen(+PORT, () => {
		console.log(`Сервер запущен на порту ${PORT}`);
	});
});
