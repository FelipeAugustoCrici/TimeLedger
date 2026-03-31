import { useState, useEffect, useCallback } from 'react';
import type { TaskEntry, TaskEntryFormData, EntryFilters } from '@/types';
import { taskEntryService } from '@/services/taskEntry.service';

export function useEntries(filters: Partial<EntryFilters> = {}) {
  const [entries, setEntries] = useState<TaskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize filters to use as dep
  const filtersKey = JSON.stringify(filters);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskEntryService.listEntries(JSON.parse(filtersKey));
      setEntries(res.data);
    } catch {
      setError('Erro ao carregar lançamentos.');
    } finally {
      setLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const createEntry = async (data: TaskEntryFormData) => {
    const res = await taskEntryService.createEntry(data);
    setEntries((prev) => [res.data, ...prev]);
    return res.data;
  };

  const updateEntry = async (id: string, data: TaskEntryFormData) => {
    const res = await taskEntryService.updateEntry(id, data);
    setEntries((prev) => prev.map((e) => (e.id === id ? res.data : e)));
    return res.data;
  };

  const deleteEntry = async (id: string) => {
    await taskEntryService.deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return { entries, loading, error, refetch: fetchEntries, createEntry, updateEntry, deleteEntry };
}
