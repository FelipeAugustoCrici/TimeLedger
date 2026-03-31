import { cn } from '@/common/helpers';
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

const fieldBase = 'w-full rounded-lg border bg-elevated px-3 text-sm text-primary placeholder:text-muted border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; hint?: string; }
export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-secondary">{label}</label>}
      <input id={inputId} {...props} className={cn(fieldBase, 'h-9', error && 'border-danger focus:border-danger focus:ring-danger/20', className)} />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; }
export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={selectId} className="text-sm font-medium text-secondary">{label}</label>}
      <select id={selectId} {...props} className={cn(fieldBase, 'h-9', error && 'border-danger', className)}>{children}</select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; hint?: string; }
export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={textareaId} className="text-sm font-medium text-secondary">{label}</label>}
      <textarea id={textareaId} {...props} className={cn(fieldBase, 'py-2 resize-none', error && 'border-danger', className)} />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
