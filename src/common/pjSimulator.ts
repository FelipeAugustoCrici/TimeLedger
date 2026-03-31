/**
 * Simulador de rendimento líquido PJ (cooperativa/contabilidade)
 *
 * Baseado na planilha de cálculo com:
 * - Pró-Labore (mín R$1.518 / teto R$8.157,41)
 * - Antecipação de Sobras (remuneração - pró-labore)
 * - INSS 20% sobre pró-labore
 * - IRRF sobre pró-labore (tabela progressiva 2024)
 * - Taxa Administrativa sobre remuneração total
 * - Quota de Capital (valor fixo)
 */

// ─── Tabela IRRF 2024 (base: pró-labore) ─────────────────────────────────────
interface IrrfFaixa {
  ate: number;
  aliquota: number;
  deducao: number;
}

const IRRF_TABLE: IrrfFaixa[] = [
  { ate: 2259.20,  aliquota: 0,     deducao: 0       },
  { ate: 2826.65,  aliquota: 0.075, deducao: 169.44  },
  { ate: 3751.05,  aliquota: 0.15,  deducao: 381.44  },
  { ate: 4664.68,  aliquota: 0.225, deducao: 662.77  },
  { ate: Infinity, aliquota: 0.275, deducao: 896.00  },
];

const DEDUCAO_POR_DEPENDENTE = 189.59;

// ─── Constantes ───────────────────────────────────────────────────────────────
export const PRO_LABORE_MIN  = 1621.00; // salário mínimo 2026
export const PRO_LABORE_TETO = 8157.41;
export const INSS_ALIQUOTA   = 0.20;

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface SimulatorInput {
  remuneracaoTotal: number;   // valor bruto do mês
  proLabore: number;          // entre mín e teto
  dependentes: number;        // número de dependentes
  taxaAdm: number;            // % taxa administrativa (ex: 4.5)
}

export interface SimulatorResult {
  remuneracaoTotal: number;
  proLabore: number;
  antecipacaoSobras: number;
  inss: number;
  irrf: number;
  taxaAdm: number;
  totalDescontos: number;
  totalLiquido: number;
  // detalhes
  baseIrrf: number;
  aliquotaIrrf: number;
  irrfIncide: boolean;
}

// ─── Cálculo IRRF ─────────────────────────────────────────────────────────────
function calcIrrf(proLabore: number, dependentes: number): { irrf: number; base: number; aliquota: number } {
  const deducaoDep = dependentes * DEDUCAO_POR_DEPENDENTE;
  const base = Math.max(proLabore - deducaoDep, 0);

  const faixa = IRRF_TABLE.find((f) => base <= f.ate) ?? IRRF_TABLE[IRRF_TABLE.length - 1];
  const irrf = Math.max(base * faixa.aliquota - faixa.deducao, 0);

  return { irrf, base, aliquota: faixa.aliquota };
}

// ─── Simulação principal ──────────────────────────────────────────────────────
export function simulate(input: SimulatorInput): SimulatorResult {
  const { remuneracaoTotal, proLabore, dependentes, taxaAdm } = input;

  const antecipacaoSobras = Math.max(remuneracaoTotal - proLabore, 0);
  const inss = proLabore * INSS_ALIQUOTA;
  const { irrf, base: baseIrrf, aliquota: aliquotaIrrf } = calcIrrf(proLabore, dependentes);
  const taxaAdmValor = remuneracaoTotal * (taxaAdm / 100);

  const totalDescontos = inss + irrf + taxaAdmValor;
  const totalLiquido = remuneracaoTotal - totalDescontos;

  return {
    remuneracaoTotal,
    proLabore,
    antecipacaoSobras,
    inss: -inss,
    irrf: -irrf,
    taxaAdm: -taxaAdmValor,
    totalDescontos: -totalDescontos,
    totalLiquido,
    baseIrrf,
    aliquotaIrrf,
    irrfIncide: irrf > 0,
  };
}

// ─── Sugestão de pró-labore ───────────────────────────────────────────────────
// Retorna o pró-labore que minimiza INSS+IRRF dado o total
export function suggestProLabore(remuneracaoTotal: number, _dependentes: number): number {
  // Ponto ótimo: usar o mínimo possível (mín legal) para reduzir INSS
  // mas verificar se não gera IRRF desnecessário
  const min = Math.min(PRO_LABORE_MIN, remuneracaoTotal);
  return Math.max(min, PRO_LABORE_MIN);
}
