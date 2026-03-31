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

export interface Category {
  id: string;
  name: string;
  color: string;    // hex "#rrggbb"
  billable: boolean; // false = não entra no cálculo de horas/valor
}

export const categoryService = {
  async list(): Promise<Category[]> {
    const res = await request<{ data: Category[] }>('/categories');
    return res.data ?? [];
  },

  async create(name: string, color: string): Promise<Category> {
    const res = await request<{ data: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await request(`/categories/${id}`, { method: 'DELETE' });
  },
};
