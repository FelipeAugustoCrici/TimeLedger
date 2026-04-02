import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TaskEntry, DayGroup } from '@/types';

export { todayISO, getWeekRange, getMonthRange, isInRange, formatDateShort as formatDate } from '@/lib/dateUtils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let label: string;
  if (h === 0) label = `${m}m`;
  else if (m === 0) label = `${h}h`;
  else label = `${h}h ${m}m`;
  return `${label} (${minutes} min)`;
}

export function formatDecimalHours(value: number): string {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Calculations ─────────────────────────────────────────────────────────────

export function calcTotalAmount(minutes: number, hourlyRate: number): number {
  return (minutes / 60) * hourlyRate;
}

export function minutesToDecimal(minutes: number): number {
  return minutes / 60;
}

// ─── Grouping ─────────────────────────────────────────────────────────────────

export function groupByDay(entries: TaskEntry[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const entry of entries) {
    if (!map.has(entry.date)) {
      map.set(entry.date, { date: entry.date, entries: [], totalMinutes: 0, totalAmount: 0 });
    }
    const group = map.get(entry.date) as DayGroup;
    group.entries.push(entry);
    group.totalMinutes += entry.time_spent_minutes;
    group.totalAmount += entry.total_amount;
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}
