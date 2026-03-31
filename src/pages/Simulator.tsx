import { useState, useMemo, useEffect } from 'react';
import { Calculator, Info, TrendingDown, TrendingUp, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { simulate, suggestProLabore, PRO_LABORE_MIN, PRO_LABORE_TETO } from '@/common/pjSimulator';
import { useEntries } from '@/hooks/useEntries';
import { useCategories, isBillableCategory } from '@/hooks/useCategories';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Input } from '@/components/ui/Input';
import { formatCurrency, cn } from '@/common/helpers';

const DEFAULT_TAXA_ADM = 4.5;

export default function Simulator() {
  const { entries, loading: loadingEntries } = useEntries({ period: 'month' });
  const { categories } = useCategories();

  // Soma real dos lançamentos do mês (apenas billable)
  const totalMes = useMemo(
    () => entries
      .filter((e) => isBillableCategory(categories, e.category))
      .reduce((acc, e) => acc + e.total_amount, 0),
    [entries, categories],
  );

  const [remuneracao,   setRemuneracao]   = useState(0);
  const [proLabore,     setProLabore]     = useState(PRO_LABORE_MIN);
  const [dependentes,   setDependentes]   = useState(0);
  const [taxaAdm,       setTaxaAdm]       = useState(DEFAULT_TAXA_ADM);
  const [showDetails,   setShowDetails]   = useState(false);

  // Preenche automaticamente quando os lançamentos carregam
  useEffect(() => {
    if (!loadingEntries && totalMes > 0) {
      setRemuneracao(totalMes);
    }
  }, [totalMes, loadingEntries]);

  const proLaboreClamped = Math.min(
    Math.max(proLabore, PRO_LABORE_MIN),
    Math.min(PRO_LABORE_TETO, remuneracao || PRO_LABORE_TETO),
  );

  const result = useMemo(() => simulate({
    remuneracaoTotal: remuneracao,
    proLabore: proLaboreClamped,
    dependentes,
    taxaAdm,
  }), [remuneracao, proLaboreClamped, dependentes, taxaAdm]);

  const suggested   = useMemo(() => suggestProLabore(remuneracao, dependentes), [remuneracao, dependentes]);
  const liquidoPct  = remuneracao > 0 ? (result.totalLiquido / remuneracao) * 100 : 0;
  const proLaboreTeto = Math.min(PRO_LABORE_TETO, remuneracao || PRO_LABORE_TETO);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-1 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand-light">
            <Calculator size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Parâmetros da simulação</p>
            <p className="text-xs text-muted">Ajuste os valores para simular seu líquido</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Remuneração total */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">Remuneração total</span>
              {totalMes > 0 && Math.abs(remuneracao - totalMes) > 0.01 && (
                <button
                  onClick={() => setRemuneracao(totalMes)}
                  className="flex items-center gap-1 text-[10px] text-brand-light hover:text-brand transition-colors"
                >
                  <RefreshCw size={10} />
                  Usar total do mês
                </button>
              )}
            </div>
            <div className="relative">
              <CurrencyInput
                value={remuneracao}
                onChange={setRemuneracao}
                placeholder="0,00"
                disabled={loadingEntries}
              />
              {loadingEntries && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-border border-t-brand animate-spin" />
              )}
            </div>
            <p className="text-[10px] text-muted">
              {loadingEntries
                ? 'Carregando lançamentos do mês...'
                : totalMes > 0
                  ? `${entries.length} lançamento${entries.length !== 1 ? 's' : ''} em março · ${formatCurrency(totalMes)}`
                  : 'Nenhum lançamento no mês atual — insira manualmente'
              }
            </p>
          </div>

          {/* Pró-Labore */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">Pró-Labore</span>
              {proLabore !== suggested && (
                <button
                  onClick={() => setProLabore(suggested)}
                  className="text-[10px] text-brand-light hover:text-brand transition-colors"
                >
                  Usar mínimo ({formatCurrency(suggested)})
                </button>
              )}
            </div>
            <CurrencyInput
              value={proLabore}
              onChange={(v) => setProLabore(Math.max(v, PRO_LABORE_MIN))}
              hint={`Mín ${formatCurrency(PRO_LABORE_MIN)} · Teto ${formatCurrency(proLaboreTeto)}`}
            />
          </div>

          {/* Dependentes */}
          <Input
            label="Nº de dependentes"
            type="number"
            min={0}
            max={10}
            step={1}
            value={dependentes}
            onChange={(e) => setDependentes(parseInt(e.target.value) || 0)}
            hint="Dedução de R$189,59 por dependente no IRRF"
          />

          {/* Taxa administrativa */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Taxa administrativa (%)</label>
            <div className="flex h-9 items-center rounded-lg border border-border bg-elevated focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-colors">
              <input
                type="number" min={0} max={20} step={0.1}
                value={taxaAdm}
                onChange={(e) => setTaxaAdm(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-transparent pl-3 pr-1 text-sm text-primary focus:outline-none"
              />
              <span className="pr-3 text-sm text-muted select-none">%</span>
            </div>
          </div>

        </div>
      </div>

      {/* Resultado principal */}
      {remuneracao > 0 && (
        <div className={cn(
          'rounded-xl border p-6 flex flex-col gap-4',
          liquidoPct >= 80 ? 'border-success/30 bg-success/5' :
          liquidoPct >= 60 ? 'border-brand/30 bg-brand/5' :
          'border-warning/30 bg-warning/5',
        )}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide font-medium">Total líquido estimado</p>
              <p className={cn(
                'text-4xl font-bold mt-1 tabular-nums',
                liquidoPct >= 80 ? 'text-success' : liquidoPct >= 60 ? 'text-brand-light' : 'text-warning',
              )}>
                {formatCurrency(result.totalLiquido)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <TrendingDown size={14} className="text-danger" />
                <span className="text-sm text-danger font-medium tabular-nums">{formatCurrency(result.totalDescontos)}</span>
                <span className="text-xs text-muted">descontos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className={liquidoPct >= 70 ? 'text-success' : 'text-warning'} />
                <span className={cn('text-sm font-medium', liquidoPct >= 70 ? 'text-success' : 'text-warning')}>
                  {liquidoPct.toFixed(1)}%
                </span>
                <span className="text-xs text-muted">do bruto</span>
              </div>
            </div>
          </div>

          <div className="h-2.5 w-full rounded-full bg-elevated overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                liquidoPct >= 80 ? 'bg-success' : liquidoPct >= 60 ? 'bg-brand' : 'bg-warning',
              )}
              style={{ width: `${Math.min(liquidoPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Breakdown detalhado */}
      {remuneracao > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-hover/40 transition-colors"
          >
            <p className="text-sm font-semibold text-primary">Detalhamento dos cálculos</p>
            {showDetails ? <ChevronUp size={15} className="text-muted" /> : <ChevronDown size={15} className="text-muted" />}
          </button>

          {showDetails && (
            <div className="border-t border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-elevated/40">
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Item</th>
                    <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted uppercase tracking-wide">Valor</th>
                    <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Base de cálculo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <Row label="Remuneração total"     value={result.remuneracaoTotal}   positive base="Bruto do mês" />
                  <Row label="Pró-Labore"            value={result.proLabore}          positive base="Fonte tributável" />
                  <Row label="Antecipação de Sobras" value={result.antecipacaoSobras}  positive base="Fonte não tributável" />
                  <Row label="INSS 20%"              value={result.inss}                        base={`Sobre pró-labore ${formatCurrency(result.proLabore)}`} />
                  <Row
                    label={`IRRF ${(result.aliquotaIrrf * 100).toFixed(1)}%`}
                    value={result.irrf}
                    base={result.irrfIncide
                      ? `Base ${formatCurrency(result.baseIrrf)} (${dependentes} dep.)`
                      : 'Isento'}
                  />
                  <Row label={`Taxa Adm ${taxaAdm}%`} value={result.taxaAdm} base={`Sobre ${formatCurrency(result.remuneracaoTotal)}`} />
                </tbody>
                <tfoot>
                  <tr className="bg-elevated/60 border-t-2 border-border">
                    <td className="px-5 py-3 text-sm font-semibold text-primary">Total de descontos</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-danger tabular-nums">{formatCurrency(result.totalDescontos)}</td>
                    <td className="hidden sm:table-cell" />
                  </tr>
                  <tr className="bg-elevated/30">
                    <td className="px-5 py-3 text-sm font-bold text-primary">Total líquido</td>
                    <td className={cn(
                      'px-5 py-3 text-right text-base font-bold tabular-nums',
                      result.totalLiquido >= 0 ? 'text-success' : 'text-danger',
                    )}>
                      {formatCurrency(result.totalLiquido)}
                    </td>
                    <td className="hidden sm:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dica */}
      <div className="flex gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4">
        <Info size={15} className="text-brand-light shrink-0 mt-0.5" />
        <div className="text-xs text-secondary leading-relaxed">
          <p>
            <span className="font-medium text-primary">Pró-Labore mínimo</span> ({formatCurrency(PRO_LABORE_MIN)}) reduz o INSS e pode evitar IRRF.
            {!result.irrfIncide
              ? <span className="text-success"> Com {dependentes} dependente{dependentes !== 1 ? 's' : ''}, você está isento de IRRF.</span>
              : <span className="text-warning"> Há incidência de IRRF de {formatCurrency(Math.abs(result.irrf))}.</span>
            }
          </p>
          <p className="mt-1">
            A <span className="font-medium text-primary">Antecipação de Sobras</span> ({formatCurrency(result.antecipacaoSobras)}) não é tributável pelo IRRF.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, base, positive }: {
  label: string; value: number; base?: string; positive?: boolean;
}) {
  return (
    <tr className="hover:bg-hover/30 transition-colors">
      <td className="px-5 py-3 text-secondary">{label}</td>
      <td className={cn(
        'px-5 py-3 text-right font-medium tabular-nums',
        positive ? 'text-primary' : value < 0 ? 'text-danger' : 'text-primary',
      )}>
        {formatCurrency(value)}
      </td>
      <td className="px-5 py-3 text-right text-xs text-muted hidden sm:table-cell">{base}</td>
    </tr>
  );
}
