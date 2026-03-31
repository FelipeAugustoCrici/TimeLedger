import { useState, useCallback } from 'react';
import { useEntries } from '@/hooks/useEntries';
import { taskEntryService } from '@/services/taskEntry.service';
import type { TimeBlock, TimeBlockFormData, SelectionState, BlockType } from '../types';
import type { TaskEntryFormData } from '@/types';
import moment from 'moment/min/moment-with-locales';

export const SLOTS_START = 14; // 07:00
export const SLOTS_END   = 44; // 22:00
export const TOTAL_SLOTS = SLOTS_END - SLOTS_START;

export function slotToTime(slot: number): string {
  const totalMins = slot * 30;
  const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
  const m = (totalMins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** "HH:MM" → minutos totais desde meia-noite */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** minutos totais → slot (para posicionamento visual) */
export function timeToSlot(time: string): number {
  return Math.floor(timeToMinutes(time) / 30);
}

/** Duração real em minutos entre dois horários "HH:MM" */
export function timeDiffMinutes(start: string, end: string): number {
  return Math.max(0, timeToMinutes(end) - timeToMinutes(start));
}

export function slotDurationMinutes(start: number, end: number): number {
  return (end - start) * 30;
}

// ─── Converter entries → blocks com detecção de colisão ──────────────────────
function entriesToBlocks(entries: import('@/types').TaskEntry[]): TimeBlock[] {
  const byDate = new Map<string, import('@/types').TaskEntry[]>();
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  const result: TimeBlock[] = [];

  byDate.forEach((dayEntries) => {
    const dayBlocks: TimeBlock[] = dayEntries.map((entry) => {
      const startSlot = entry.start_time ? timeToSlot(entry.start_time) : SLOTS_START;
      const slotCount = Math.max(1, Math.ceil(entry.time_spent_minutes / 30));
      const endSlot   = entry.end_time
        ? timeToSlot(entry.end_time)
        : Math.min(startSlot + slotCount, SLOTS_END);
      return {
        id: entry.id, date: entry.date,
        startSlot, endSlot,
        startTime: entry.start_time ?? slotToTime(startSlot),
        endTime:   entry.end_time   ?? slotToTime(endSlot),
        taskCode: entry.task_code, description: entry.description,
        type: 'work' as BlockType,
        category: entry.category, project: entry.project, notes: entry.notes,
        hourlyRate: entry.hourly_rate, totalMinutes: entry.time_spent_minutes,
        totalAmount: entry.total_amount, status: entry.status,
        col: 0, totalCols: 1,
      };
    });

    // Distribui em colunas para blocos que se sobrepõem
    const cols: TimeBlock[][] = [];
    for (const block of dayBlocks) {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        if (!cols[c].some((b) => block.startSlot < b.endSlot && block.endSlot > b.startSlot)) {
          cols[c].push(block); block.col = c; placed = true; break;
        }
      }
      if (!placed) { block.col = cols.length; cols.push([block]); }
    }

    // Calcula totalCols por grupo de colisão
    for (const block of dayBlocks) {
      let maxCol = block.col ?? 0;
      for (const other of dayBlocks) {
        if (other.id !== block.id && block.startSlot < other.endSlot && block.endSlot > other.startSlot)
          maxCol = Math.max(maxCol, other.col ?? 0);
      }
      block.totalCols = maxCol + 1;
    }

    result.push(...dayBlocks);
  });

  return result;
}

export function useTimeGrid(weekStart: string) {
  const weekEnd = moment(weekStart).endOf('isoWeek').format('YYYY-MM-DD');
  const { entries, loading, refetch, deleteEntry } = useEntries({ startDate: weekStart, endDate: weekEnd, period: 'custom' });

  const blocks: TimeBlock[] = entriesToBlocks(entries);

  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);

  const startSelection = useCallback((date: string, slot: number) => {
    setSelection({ date, startSlot: slot, endSlot: slot + 1 });
  }, []);

  const extendSelection = useCallback((slot: number) => {
    setSelection((prev) => prev ? { ...prev, endSlot: Math.max(prev.startSlot + 1, slot + 1) } : prev);
  }, []);

  const confirmSelection = useCallback(() => {
    if (selection) { setEditingBlock(null); setDrawerOpen(true); }
  }, [selection]);

  const cancelSelection = useCallback(() => {
    setSelection(null); setDrawerOpen(false);
  }, []);

  const updateSelection = useCallback((startSlot: number, endSlot: number) => {
    setSelection((prev) => prev ? { ...prev, startSlot, endSlot } : prev);
  }, []);

  const openBlock = useCallback((block: TimeBlock) => {
    setEditingBlock(block);
    setSelection({ date: block.date, startSlot: block.startSlot, endSlot: block.endSlot });
    setDrawerOpen(true);
  }, []);

  const saveBlock = useCallback(async (form: TimeBlockFormData) => {
    if (!selection) return;
    const minutes = timeDiffMinutes(form.startTime, form.endTime);
    const payload: TaskEntryFormData = {
      date: selection.date,
      task_code: form.taskCode,
      description: form.description,
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
      hourly_rate: form.hourlyRate,
      status: form.status,
      category: form.category || undefined,
      project: form.project || undefined,
      notes: form.notes || undefined,
      start_time: form.startTime,
      end_time: form.endTime,
    };
    if (editingBlock) {
      await taskEntryService.updateEntry(editingBlock.id, payload);
    } else {
      await taskEntryService.createEntry(payload);
    }
    await refetch();
    setDrawerOpen(false);
    setSelection(null);
    setEditingBlock(null);
  }, [selection, editingBlock, refetch]);

  const removeBlock = useCallback(async (id: string) => {
    await deleteEntry(id);
    setDrawerOpen(false); setSelection(null); setEditingBlock(null);
  }, [deleteEntry]);

  return {
    blocks, loading, selection, drawerOpen, editingBlock,
    startSelection, extendSelection, confirmSelection, cancelSelection,
    updateSelection, openBlock, saveBlock, removeBlock,
  };
}
