import { useState } from 'react';
import { Play, Pause, Square, Trash2 } from 'lucide-react';
import { useTimer } from '@/lib/timer/useTimer';
import { formatElapsed, calcRemainingMinutes } from '@/lib/timer/timerUtils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EntryForm } from '@/components/shared/EntryForm';
import { taskEntryService } from '@/services/taskEntry.service';
import { cn } from '@/common/helpers';
import type { TaskEntryFormData } from '@/types';

export function TimerWidget() {
  const {
    timer,
    displaySeconds,
    start,
    pause,
    resume,
    stop,
    discard,
    entryFormData,
    splitSession,
    onEntrySaved,
    onEntryCancel,
    onSplit,
  } = useTimer();

  const [discardOpen, setDiscardOpen] = useState(false);

  const handleDiscard = async () => {
    setDiscardOpen(false);
    await discard();
  };

  const handleEntrySubmit = async (data: TaskEntryFormData) => {
    if (entryFormData?.sourceEntryId) {
      await taskEntryService.updateEntry(entryFormData.sourceEntryId, data);
    } else {
      await taskEntryService.createEntry(data);
    }
    await onEntrySaved();
  };

  const handleSplit = async (data: TaskEntryFormData) => {
    await onSplit(data);
  };

  const remainingMinutes = splitSession
    ? calcRemainingMinutes(splitSession.totalMinutes, splitSession.usedMinutes)
    : undefined;

  // Split temporariamente oculto — remover o `{}` quando pronto para reativar:
  // const splitProps = splitSession && remainingMinutes !== undefined && remainingMinutes > 0
  //   ? { onSplit: handleSplit, remainingMinutes }
  //   : {};
  const splitProps = {};

  const isRunning = timer?.status === 'running';
  const formatted = formatElapsed(displaySeconds);

  return (
    <>
      {/* ─── Widget ─────────────────────────────────────────────────────────── */}
      {!timer ? (
        <button
          onClick={() => start()}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand-light hover:bg-brand/20 transition-colors"
          aria-label="Iniciar timer"
          title="Iniciar timer"
        >
          <Play size={15} fill="currentColor" />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-2.5 py-1.5">
          {/* Tempo formatado */}
          <span
            className={cn(
              'text-xs font-mono font-semibold tabular-nums min-w-[58px] text-center',
              isRunning ? 'text-brand-light' : 'text-muted',
            )}
            title={isRunning ? 'Rodando' : 'Pausado'}
          >
            {isRunning ? formatted : (
              <span className="flex items-center gap-1">
                <Pause size={10} className="shrink-0" />
                {formatted}
              </span>
            )}
          </span>

          {/* Separador */}
          <span className="h-4 w-px bg-border" />

          {/* Play / Pause */}
          {isRunning ? (
            <button
              onClick={pause}
              className="flex h-6 w-6 items-center justify-center rounded text-muted hover:text-primary hover:bg-hover transition-colors"
              aria-label="Pausar timer"
              title="Pausar"
            >
              <Pause size={13} />
            </button>
          ) : (
            <button
              onClick={resume}
              className="flex h-6 w-6 items-center justify-center rounded text-muted hover:text-primary hover:bg-hover transition-colors"
              aria-label="Retomar timer"
              title="Retomar"
            >
              <Play size={13} fill="currentColor" />
            </button>
          )}

          {/* Stop */}
          <button
            onClick={stop}
            className="flex h-6 w-6 items-center justify-center rounded text-muted hover:text-primary hover:bg-hover transition-colors"
            aria-label="Parar timer e salvar"
            title="Parar e salvar"
          >
            <Square size={13} fill="currentColor" />
          </button>

          {/* Discard */}
          <button
            onClick={() => setDiscardOpen(true)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            aria-label="Descartar timer"
            title="Descartar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* ─── Modais — sempre montados para não perder estado ────────────────── */}

      {/* Modal de confirmação de descarte */}
      <Modal open={discardOpen} onClose={() => setDiscardOpen(false)} title="Descartar timer?" size="sm">
        <div className="flex flex-col gap-5">
          <p className="text-sm text-secondary">
            O tempo registrado será perdido e nenhum lançamento será criado.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDiscardOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDiscard}>Descartar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal do EntryForm ao parar o timer */}
      <Modal
        open={!!entryFormData}
        onClose={onEntryCancel}
        title="Salvar lançamento"
        size="lg"
      >
        {entryFormData && (
          <EntryForm
            onSubmit={handleEntrySubmit}
            onCancel={onEntryCancel}
            initialData={{
              date: entryFormData.date,
              hours: Math.floor(entryFormData.time_spent_minutes / 60),
              minutes: entryFormData.time_spent_minutes % 60,
              ...(entryFormData.task_code !== undefined && { task_code: entryFormData.task_code }),
              ...(entryFormData.description !== undefined && { description: entryFormData.description }),
              ...(entryFormData.project !== undefined && { project: entryFormData.project }),
              ...(entryFormData.category !== undefined && { category: entryFormData.category }),
              ...(entryFormData.hourly_rate !== undefined && { hourly_rate: entryFormData.hourly_rate }),
              ...(entryFormData.status !== undefined && { status: entryFormData.status }),
              ...(entryFormData.notes !== undefined && { notes: entryFormData.notes }),
              ...(entryFormData.start_time !== undefined && { start_time: entryFormData.start_time }),
              ...(entryFormData.end_time !== undefined && { end_time: entryFormData.end_time }),
            }}
            {...splitProps}
          />
        )}
      </Modal>
    </>
  );
}
