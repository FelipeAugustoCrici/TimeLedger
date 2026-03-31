import { useState, useEffect, useRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/common/helpers';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  label?: string;
  hint?: string;
  error?: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
}

/**
 * Input de moeda com formatação pt-BR em tempo real.
 * Armazena e emite o valor numérico puro (float).
 * Exibe "R$ 1.234,56" enquanto o usuário digita apenas dígitos.
 */
export function CurrencyInput({
  label,
  hint,
  error,
  value,
  onChange,
  prefix = 'R$',
  className,
  id,
  disabled,
  placeholder,
  ...rest
}: CurrencyInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const inputRef = useRef<HTMLInputElement>(null);

  // Formata número para exibição: 1234.56 → "1.234,56"
  const format = (num: number): string => {
    if (num === 0) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [displayValue, setDisplayValue] = useState(() => format(value));

  // Sincroniza display quando o valor externo muda (ex: preenchimento automático)
  useEffect(() => {
    setDisplayValue(format(value));
  }, [value]); // format é estável (definida fora do render)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não é dígito
    const digits = e.target.value.replace(/\D/g, '');
    if (digits === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Interpreta os últimos 2 dígitos como centavos
    const cents = parseInt(digits, 10);
    const numeric = cents / 100;

    const formatted = numeric.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setDisplayValue(formatted);
    onChange(numeric);
  };

  const handleFocus = () => {
    // Seleciona tudo ao focar para facilitar substituição
    inputRef.current?.select();
  };

  const handleBlur = () => {
    // Garante formatação correta ao sair do campo
    setDisplayValue(format(value));
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-secondary">
          {label}
        </label>
      )}
      <div className={cn(
        'flex h-9 items-center rounded-lg border bg-elevated transition-colors duration-150',
        'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
        error ? 'border-danger focus-within:border-danger focus-within:ring-danger/20' : 'border-border',
        disabled && 'opacity-50 cursor-not-allowed',
      )}>
        <span className="pl-3 pr-1.5 text-sm text-muted select-none shrink-0">{prefix}</span>
        <input
          {...rest}
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder ?? '0,00'}
          className={cn(
            'flex-1 bg-transparent py-0 pr-3 text-sm text-primary placeholder:text-muted',
            'focus:outline-none min-w-0',
            className,
          )}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-[10px] text-muted">{hint}</p>}
    </div>
  );
}
