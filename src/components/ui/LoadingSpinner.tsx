import { cn } from '@/common/helpers';

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export function LoadingSpinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={cn('inline-block rounded-full border-2 border-border border-t-brand animate-spin', sizes[size], className)} aria-label="Carregando" />;
}

export function PageLoader() {
  return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
}
