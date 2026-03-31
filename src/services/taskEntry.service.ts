import type { TaskEntry, TaskEntryFormData, PaginatedResponse, EntryFilters } from '@/types';

const BASE = 'http://localhost:8080/api/v1';

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

function toQueryString(filters: Partial<EntryFilters>): string {
  const params = new URLSearchParams();
  if (filters.period && filters.period !== 'custom') params.set('period', filters.period);
  if (filters.period === 'custom') {
    if (filters.startDate) params.set('start_date', filters.startDate);
    if (filters.endDate) params.set('end_date', filters.endDate);
  }
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.project) params.set('project', filters.project);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const taskEntryService = {
  async listEntries(filters: Partial<EntryFilters> = {}): Promise<PaginatedResponse<TaskEntry>> {
    const res = await request<{ data: TaskEntry[]; total: number }>(`/entries${toQueryString(filters)}`);
    return { data: res.data ?? [], total: res.total ?? 0, page: 1, perPage: 100 };
  },

  async getEntryById(id: string): Promise<{ data: TaskEntry; success: boolean }> {
    const res = await request<{ data: TaskEntry }>(`/entries/${id}`);
    return { data: res.data, success: true };
  },

  async createEntry(payload: TaskEntryFormData): Promise<{ data: TaskEntry; success: boolean; message?: string }> {
    const body = {
      date: payload.date,
      task_code: payload.task_code,
      description: payload.description,
      time_spent_minutes: payload.hours * 60 + payload.minutes,
      hourly_rate: payload.hourly_rate,
      status: payload.status,
      category: payload.category ?? '',
      project: payload.project ?? '',
      notes: payload.notes ?? '',
      start_time: payload.start_time ?? null,
      end_time: payload.end_time ?? null,
    };
    const res = await request<{ data: TaskEntry }>('/entries', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { data: res.data, success: true, message: 'Lançamento criado com sucesso.' };
  },

  async updateEntry(id: string, payload: Partial<TaskEntryFormData>): Promise<{ data: TaskEntry; success: boolean }> {
    const body: Record<string, unknown> = {};
    if (payload.date !== undefined) body.date = payload.date;
    if (payload.task_code !== undefined) body.task_code = payload.task_code;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.hours !== undefined || payload.minutes !== undefined) {
      body.time_spent_minutes = (payload.hours ?? 0) * 60 + (payload.minutes ?? 0);
    }
    if (payload.hourly_rate !== undefined) body.hourly_rate = payload.hourly_rate;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.category !== undefined) body.category = payload.category;
    if (payload.project !== undefined) body.project = payload.project;
    if (payload.notes !== undefined) body.notes = payload.notes;
    if (payload.start_time !== undefined) body.start_time = payload.start_time ?? null;
    if (payload.end_time !== undefined) body.end_time = payload.end_time ?? null;

    const res = await request<{ data: TaskEntry }>(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return { data: res.data, success: true };
  },

  async deleteEntry(id: string): Promise<{ data: null; success: boolean }> {
    await request(`/entries/${id}`, { method: 'DELETE' });
    return { data: null, success: true };
  },

  async getProjects(): Promise<string[]> {
    const res = await request<{ data: string[] }>('/entries/meta/projects');
    return res.data ?? [];
  },

  async getCategories(): Promise<string[]> {
    const res = await request<{ data: string[] }>('/entries/meta/categories');
    return res.data ?? [];
  },
};
