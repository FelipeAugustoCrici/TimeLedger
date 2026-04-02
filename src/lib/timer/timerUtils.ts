import type { ActiveTimer } from '@/types';

/**
 * Formats a duration in seconds to HH:MM:SS with zero-padding.
 * @example formatElapsed(0)     → "00:00:00"
 * @example formatElapsed(3661)  → "01:01:01"
 * @example formatElapsed(86399) → "23:59:59"
 */
export function formatElapsed(seconds: number): string {
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return [hh, mm, ss].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Calculates the display seconds for a timer given the current timestamp.
 * - paused: returns elapsed_seconds as-is
 * - running with started_at: returns elapsed_seconds + seconds since started_at
 * - running without started_at: returns elapsed_seconds
 */
export function calcDisplaySeconds(timer: ActiveTimer, now: number): number {
  if (timer.status === 'paused') {
    return timer.elapsed_seconds;
  }

  if (timer.started_at !== null) {
    const elapsed = Math.floor((now - new Date(timer.started_at).getTime()) / 1000);
    return timer.elapsed_seconds + elapsed;
  }

  return timer.elapsed_seconds;
}

// --- Split Session utilities ---

export interface SplitSession {
  totalMinutes: number;
  usedMinutes: number;
}

/**
 * Converts elapsed seconds to minutes for an entry, minimum 1 minute.
 * @example computeEntryMinutes(0)    → 1
 * @example computeEntryMinutes(90)   → 2
 * @example computeEntryMinutes(3600) → 60
 */
export function computeEntryMinutes(elapsedSeconds: number): number {
  return Math.max(1, Math.round(elapsedSeconds / 60));
}

/**
 * Calculates remaining minutes in a split session.
 */
export function calcRemainingMinutes(totalMinutes: number, usedMinutes: number): number {
  return totalMinutes - usedMinutes;
}

/**
 * Applies a split by adding splitMinutes to usedMinutes.
 */
export function applySplit(session: SplitSession, splitMinutes: number): SplitSession {
  return { ...session, usedMinutes: session.usedMinutes + splitMinutes };
}

/**
 * Returns true if the split button should be shown (remaining > 0).
 */
export function shouldShowSplitButton(totalMinutes: number, usedMinutes: number): boolean {
  return totalMinutes - usedMinutes > 0;
}
