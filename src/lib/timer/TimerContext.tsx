import {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type { ActiveTimer, TaskEntry, TaskEntryFormData, TaskStatus } from '@/types';
import { timerService } from '@/services/timer.service';
import { taskEntryService } from '@/services/taskEntry.service';
import { calcDisplaySeconds, computeEntryMinutes, calcRemainingMinutes, applySplit, type SplitSession } from './timerUtils';
import { todayISO } from '@/lib/dateUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StartOptions {
  initialSeconds?: number;
  sourceEntry?: TaskEntry;
}

export interface EntryFormData {
  time_spent_minutes: number;
  date: string;
  task_code?: string;
  description?: string;
  project?: string;
  category?: string;
  hourly_rate?: number;
  status?: TaskStatus;
  notes?: string;
  start_time?: string;
  end_time?: string;
  sourceEntryId?: string;
}

interface TimerContextValue {
  timer: ActiveTimer | null;
  displaySeconds: number;
  isLoading: boolean;
  /** Dados para pré-preencher o EntryForm após stop */
  entryFormData: EntryFormData | null;
  splitSession: SplitSession | null;
  sourceEntry: TaskEntry | null;
  start: (options?: StartOptions) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  /** Pausa o timer via API e expõe entryFormData para o TimerWidget abrir o EntryForm */
  stop: () => Promise<void>;
  discard: () => Promise<void>;
  /** Chamado pelo EntryForm ao confirmar salvamento — descarta o timer */
  onEntrySaved: () => Promise<void>;
  /** Chamado pelo EntryForm ao cancelar — apenas fecha o modal, timer permanece pausado */
  onEntryCancel: () => void;
  onSplit: (data: TaskEntryFormData) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const TimerContext = createContext<TimerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [entryFormData, setEntryFormData] = useState<EntryFormData | null>(null);
  const [splitSession, setSplitSession] = useState<SplitSession | null>(null);
  const [sourceEntry, setSourceEntry] = useState<TaskEntry | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ─── Interval: inicia quando timer está running ──────────────────────────────

  useEffect(() => {
    if (timer?.status === 'running') {
      // Atualiza imediatamente antes de aguardar o primeiro tick
      setDisplaySeconds(calcDisplaySeconds(timer, Date.now()));

      intervalRef.current = setInterval(() => {
        setDisplaySeconds(calcDisplaySeconds(timer, Date.now()));
      }, 1000);
    } else {
      clearInterval_();
      if (timer) {
        setDisplaySeconds(calcDisplaySeconds(timer, Date.now()));
      }
    }

    return clearInterval_;
  }, [timer, clearInterval_]);

  // ─── Restaurar estado ao montar ──────────────────────────────────────────────

  useEffect(() => {
    timerService
      .get()
      .then((t) => {
        setTimer(t);
        if (t) setDisplaySeconds(calcDisplaySeconds(t, Date.now()));
      })
      .catch(() => {
        // Falha de rede: timer não exibido, sem crash
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const start = useCallback(async (options?: StartOptions) => {
    const t = await timerService.start(options?.initialSeconds);
    setTimer(t);
    setDisplaySeconds(calcDisplaySeconds(t, Date.now()));
    setSourceEntry(options?.sourceEntry ?? null);
  }, []);

  const pause = useCallback(async () => {
    clearInterval_();
    const t = await timerService.pause();
    setTimer(t);
    setDisplaySeconds(calcDisplaySeconds(t, Date.now()));
  }, [clearInterval_]);

  const resume = useCallback(async () => {
    const t = await timerService.resume();
    setTimer(t);
    // O interval será reiniciado pelo useEffect ao detectar status === 'running'
  }, []);

  const stop = useCallback(async () => {
    // Captura o elapsed atual antes de pausar
    const currentSeconds = calcDisplaySeconds(
      timer ?? { status: 'paused', elapsed_seconds: 0, started_at: null } as ActiveTimer,
      Date.now(),
    );

    clearInterval_();

    // Se já está pausado, não chama pause novamente — usa o elapsed atual
    let finalSeconds = currentSeconds;
    if (timer?.status === 'running') {
      try {
        const t = await timerService.pause();
        setTimer(t);
        finalSeconds = calcDisplaySeconds(t, Date.now());
        setDisplaySeconds(finalSeconds);
      } catch {
        // Falha ao pausar — usa o elapsed capturado localmente
        setTimer((prev) => prev ? { ...prev, status: 'paused', elapsed_seconds: currentSeconds } : prev);
        setDisplaySeconds(currentSeconds);
      }
    }

    // Expõe dados para o TimerWidget abrir o EntryForm
    if (sourceEntry) {
      setEntryFormData({
        time_spent_minutes: Math.max(1, Math.round(finalSeconds / 60)),
        date: sourceEntry.date,
        task_code: sourceEntry.task_code,
        description: sourceEntry.description,
        project: sourceEntry.project,
        category: sourceEntry.category,
        hourly_rate: sourceEntry.hourly_rate,
        status: sourceEntry.status,
        notes: sourceEntry.notes,
        start_time: sourceEntry.start_time,
        end_time: sourceEntry.end_time,
        sourceEntryId: sourceEntry.id,
      });
    } else {
      setEntryFormData({
        time_spent_minutes: Math.max(1, Math.round(finalSeconds / 60)),
        date: todayISO(),
      });
    }
    setSplitSession({ totalMinutes: computeEntryMinutes(finalSeconds), usedMinutes: 0 });
  }, [timer, sourceEntry, clearInterval_]);

  const discard = useCallback(async () => {
    clearInterval_();
    await timerService.discard();
    setTimer(null);
    setDisplaySeconds(0);
    setEntryFormData(null);
    setSourceEntry(null);
  }, [clearInterval_]);

  const onEntrySaved = useCallback(async () => {
    await timerService.discard();
    setTimer(null);
    setDisplaySeconds(0);
    setEntryFormData(null);
    setSplitSession(null);
    setSourceEntry(null);
  }, []);

  const onEntryCancel = useCallback(() => {
    // Apenas fecha o modal — timer permanece pausado, sem chamada à API
    setEntryFormData(null);
    setSplitSession(null);
  }, []);

  const onSplit = useCallback(async (data: TaskEntryFormData) => {
    const splitMinutes = data.hours * 60 + data.minutes;
    await taskEntryService.createEntry(data);
    const newSession = applySplit(splitSession!, splitMinutes);
    setSplitSession(newSession);
    setEntryFormData({
      time_spent_minutes: Math.max(0, calcRemainingMinutes(newSession.totalMinutes, newSession.usedMinutes)),
      date: todayISO(),
    });
  }, [splitSession]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <TimerContext.Provider
      value={{
        timer,
        displaySeconds,
        isLoading,
        entryFormData,
        splitSession,
        sourceEntry,
        start,
        pause,
        resume,
        stop,
        discard,
        onEntrySaved,
        onEntryCancel,
        onSplit,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
