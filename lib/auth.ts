import { api, setToken } from './api';
import type { AdminUser, LoginResponse } from './types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await api<LoginResponse>('/auth/login', {
    method: 'POST',
    json: { email, password },
  });
  setToken(data.accessToken);
  return data;
}

export async function fetchMe(): Promise<AdminUser> {
  return api<AdminUser>('/auth/me');
}

export function logout() {
  setToken(null);
}
