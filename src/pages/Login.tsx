import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { useToast } from '@/lib/toast/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/common/helpers';

type Mode = 'login' | 'register';

export default function Login() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
        toast.success('Bem-vindo de volta!');
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
        toast.success('Conta criada com sucesso! Bem-vindo!');
      }
      // navigate é chamado pelo useEffect acima quando isAuthenticated mudar
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/30">
            <Zap size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-primary">TaskManager</h1>
            <p className="text-sm text-muted mt-0.5">Controle de horas e tarefas</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          {/* Tabs */}
          <div className="flex rounded-lg bg-elevated p-1 mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-sm font-medium transition-all',
                  mode === m
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted hover:text-secondary',
                )}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Seu nome"
                required
                autoFocus
              />
            )}

            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus={mode === 'login'}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  className="h-9 w-full rounded-lg border bg-elevated px-3 pr-10 text-sm text-primary placeholder:text-muted border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
