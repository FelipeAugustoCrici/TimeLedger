import type { ActiveTimer } from '@/types';
import { API_BASE as BASE } from './api';

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('task-manager-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido');
  return json as T;
}

export const timerService = {
  async get(): Promise<ActiveTimer | null> {
    try {
      const res = await fetch(`${BASE}/timer`, {
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      if (!res.ok) return null;
      const json = await res.json() as { data: ActiveTimer | null };
      return json.data ?? null;
    } catch {
      return null;
    }
  },

  async start(initialSeconds?: number): Promise<ActiveTimer> {
    const body = initialSeconds !== undefined && initialSeconds > 0
      ? JSON.stringify({ initial_seconds: initialSeconds })
      : undefined;
    const res = await request<{ data: ActiveTimer }>('/timer', { method: 'POST', body });
    return res.data;
  },

  async pause(): Promise<ActiveTimer> {
    const res = await request<{ data: ActiveTimer }>('/timer/pause', { method: 'PATCH' });
    return res.data;
  },

  async resume(): Promise<ActiveTimer> {
    const res = await request<{ data: ActiveTimer }>('/timer/resume', { method: 'PATCH' });
    return res.data;
  },

  async discard(): Promise<void> {
    const res = await fetch(`${BASE}/timer`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error('Erro ao descartar timer');
    }
  },
};
