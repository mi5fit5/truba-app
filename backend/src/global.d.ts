import 'express-session';
import 'express';
import { Types } from 'mongoose';

declare global {
	namespace Express {
		interface User {
			_id: string | Types.ObjectId;
		}
	}
}

declare module 'express-session' {
	interface SessionData {
		userId?: string;
	}
}
