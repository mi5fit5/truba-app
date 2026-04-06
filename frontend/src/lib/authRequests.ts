import { api } from "./api";

export interface LoginData {
  email: string;
  password: string;
};

export interface RegisterData extends LoginData {
  username: string;
};

// Объект с запросами
export const authRequests = {
  // Регистрация
  register: (data: RegisterData) => {
    return api.post('/auth/register', data).then((res) => res.data);
  },

  // Вход
  login: (data: LoginData) => {
    return api.post('/auth/login', data).then((res) => res.data);
  },

  // Выход
  logout: () => {
    return api.post('/auth/logout').then((res) => res.data);
  }
};