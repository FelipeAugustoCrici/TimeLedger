import { useState, useEffect } from 'react';
import { Save, Clock, DollarSign, Target } from 'lucide-react';
import { useSettings } from '@/lib/settings/useSettings';
import { useToast } from '@/lib/toast/useToast';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Input } from '@/components/ui/Input';
import { formatCurrency, calcTotalAmount } from '@/common/helpers';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import type { UserSettings } from '@/types';

export default function Settings() {
  const { settings, saveSettings, loading } = useSettings();
  const toast = useToast();
  const [form, setForm] = useState<UserSettings>({ ...settings });
  const [saving, setSaving] = useState(false);

  // Sincroniza o form quando as settings carregam da API
  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const isDirty =
    form.hourlyRate !== settings.hourlyRate ||
    form.dailyHoursGoal !== settings.dailyHoursGoal ||
    form.monthlyGoal !== settings.monthlyGoal;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(form);
      toast.success('Configurações salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const dailyAmount   = calcTotalAmount(form.dailyHoursGoal * 60, form.hourlyRate);
  const weeklyAmount  = dailyAmount * 5;
  const monthlyAmount = dailyAmount * 22;

  // Cálculo da meta mensal
  const WORKING_DAYS = 22;
  const goalHoursTotal   = form.monthlyGoal > 0 && form.hourlyRate > 0 ? form.monthlyGoal / form.hourlyRate : 0;
  const goalHoursPerDay  = goalHoursTotal > 0 ? goalHoursTotal / WORKING_DAYS : 0;
  const goalMinutesPerDay = Math.ceil(goalHoursPerDay * 60);
  const goalHoursFloor   = Math.floor(goalMinutesPerDay / 60);
  const goalMinsRemainder = goalMinutesPerDay % 60;

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Remuneração */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-1 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand-light">
            <DollarSign size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Remuneração</p>
            <p className="text-xs text-muted">Valor fixo por hora trabalhada</p>
          </div>
        </div>

        <CurrencyInput
          label="Valor por hora"
          value={form.hourlyRate}
          onChange={(v) => set('hourlyRate', v)}
          hint="Usado automaticamente em todos os lançamentos"
        />
      </div>

      {/* Meta diária */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-1 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand-light">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Meta diária</p>
            <p className="text-xs text-muted">Horas que você precisa trabalhar por dia</p>
          </div>
        </div>

        <Input
          label="Horas por dia"
          type="number"
          min={1}
          max={24}
          step={0.5}
          value={form.dailyHoursGoal || ''}
          onChange={(e) => set('dailyHoursGoal', parseFloat(e.target.value) || 0)}
          hint="Usado para calcular o progresso diário no dashboard"
          placeholder="8"
        />
      </div>

      {/* Meta mensal */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-1 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand-light">
            <Target size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Meta mensal</p>
            <p className="text-xs text-muted">Quanto você quer receber por mês</p>
          </div>
        </div>

        <CurrencyInput
          label="Meta de ganho mensal"
          value={form.monthlyGoal}
          onChange={(v) => set('monthlyGoal', v)}
          hint="Calculado com base em 22 dias úteis"
        />

        {goalHoursTotal > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Total de horas',
                value: `${goalHoursTotal.toFixed(1)}h`,
                sub: 'no mês',
              },
              {
                label: 'Por dia',
                value: goalMinsRemainder > 0
                  ? `${goalHoursFloor}h ${goalMinsRemainder}min`
                  : `${goalHoursFloor}h`,
                sub: `${WORKING_DAYS} dias úteis`,
              },
              {
                label: 'Diferença',
                value: formatCurrency(form.monthlyGoal - monthlyAmount),
                sub: form.monthlyGoal > monthlyAmount ? 'acima da projeção' : form.monthlyGoal < monthlyAmount ? 'abaixo da projeção' : 'igual à projeção',
              },
            ].map(({ label, value, sub }) => (
              <div key={label} className="flex flex-col gap-1 rounded-lg bg-elevated p-3">
                <p className="text-xs text-muted">{label}</p>
                <p className="text-base font-semibold text-primary tabular-nums">{value}</p>
                <p className="text-[10px] text-muted">{sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projeção */}
      {form.hourlyRate > 0 && form.dailyHoursGoal > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
          <p className="text-sm font-semibold text-primary">Projeção de ganhos</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Por dia',    value: formatCurrency(dailyAmount),   sub: `${form.dailyHoursGoal}h/dia` },
              { label: 'Por semana', value: formatCurrency(weeklyAmount),  sub: '5 dias úteis' },
              { label: 'Por mês',   value: formatCurrency(monthlyAmount),  sub: '22 dias úteis' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="flex flex-col gap-1 rounded-lg bg-elevated p-3">
                <p className="text-xs text-muted">{label}</p>
                <p className="text-base font-semibold text-primary tabular-nums">{value}</p>
                <p className="text-[10px] text-muted">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salvar */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={!isDirty}
          loading={saving}
          icon={<Save size={15} />}
        >
          Salvar configurações
        </Button>
        {isDirty && <p className="text-xs text-muted">Você tem alterações não salvas</p>}
      </div>
    </div>
  );
}
