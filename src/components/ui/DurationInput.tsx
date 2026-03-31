import { useRef } from 'react';
import { cn } from '@/common/helpers';

interface DurationInputProps {
  label?: string;
  hint?: string;
  error?: string;
  hours: number;
  minutes: number;
  onChangeHours: (h: number) => void;
  onChangeMinutes: (m: number) => void;
  disabled?: boolean;
}

/**
 * Input de duração com campos separados de horas e minutos.
 * Exibe "Xh Ym" como preview e valida minutos (0–59).
 * Tab navega de horas → minutos automaticamente.
 */
export function DurationInput({
  label,
  hint,
  error,
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
  disabled,
}: DurationInputProps) {
  const minutesRef = useRef<HTMLInputElement>(null);

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value) || 0;
    onChangeHours(Math.max(v, 0));
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value) || 0;
    onChangeMinutes(Math.min(Math.max(v, 0), 59));
  };

  // Ao pressionar Tab ou Enter no campo de horas, foca nos minutos
  const handleHoursKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      minutesRef.current?.focus();
      minutesRef.current?.select();
    }
  };

  const totalMinutes = hours * 60 + minutes;
  const preview = totalMinutes > 0
    ? `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : hours > 0 ? '' : '0m'}`.trim()
    : '';

  const fieldBase = cn(
    'w-full bg-transparent text-center text-sm text-primary placeholder:text-muted',
    'focus:outline-none',
    disabled && 'cursor-not-allowed opacity-50',
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-secondary">{label}</label>
      )}

      <div className={cn(
        'flex h-9 items-center rounded-lg border bg-elevated transition-colors duration-150',
        'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
        error ? 'border-danger focus-within:border-danger focus-within:ring-danger/20' : 'border-border',
        disabled && 'opacity-50',
      )}>
        {/* Horas */}
        <div className="flex flex-1 items-center justify-center gap-0.5 px-2">
          <input
            type="number"
            min={0}
            value={hours || ''}
            onChange={handleHoursChange}
            onKeyDown={handleHoursKeyDown}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            placeholder="0"
            className={fieldBase}
            aria-label="Horas"
          />
          <span className="text-xs text-muted select-none">h</span>
        </div>

        {/* Separador */}
        <span className="text-muted select-none text-sm">:</span>

        {/* Minutos */}
        <div className="flex flex-1 items-center justify-center gap-0.5 px-2">
          <input
            ref={minutesRef}
            type="number"
            min={0}
            max={59}
            value={minutes || ''}
            onChange={handleMinutesChange}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            placeholder="00"
            className={fieldBase}
            aria-label="Minutos"
          />
          <span className="text-xs text-muted select-none">m</span>
        </div>

        {/* Preview */}
        {preview && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <span className="pr-3 text-xs text-brand-light font-medium select-none whitespace-nowrap">
              {preview}
            </span>
          </>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-[10px] text-muted">{hint}</p>}
    </div>
  );
}
