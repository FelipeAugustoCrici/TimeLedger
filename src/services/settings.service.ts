import type { UserSettings } from '@/types';
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
  return json.data as T;
}

interface ApiSettings {
  id: string;
  hourly_rate: number;
  daily_hours_goal: number;
  monthly_goal: number;
  updated_at: string;
}

function toUserSettings(s: ApiSettings): UserSettings {
  return { hourlyRate: s.hourly_rate, dailyHoursGoal: s.daily_hours_goal, monthlyGoal: s.monthly_goal ?? 0 };
}

export const settingsService = {
  async get(): Promise<UserSettings> {
    const data = await request<ApiSettings>('/settings');
    return toUserSettings(data);
  },

  async update(s: UserSettings): Promise<UserSettings> {
    const data = await request<ApiSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ hourly_rate: s.hourlyRate, daily_hours_goal: s.dailyHoursGoal, monthly_goal: s.monthlyGoal }),
    });
    return toUserSettings(data);
  },
};
