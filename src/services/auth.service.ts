import type { AuthResponse, LoginInput, RegisterInput, AuthUser } from '@/types';
import { API_BASE as BASE } from './api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido');
  return json.data as T;
}

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async logout(token: string): Promise<void> {
    await request('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async me(token: string): Promise<AuthUser> {
    return request<AuthUser>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
