import moment from 'moment/min/moment-with-locales';

moment.locale('pt-br');

// Helper interno para criar instâncias sempre com pt-br
const m = (date?: string, format?: string) =>
  format ? moment(date, format).locale('pt-br') : moment(date).locale('pt-br');

// ─── Formatters ───────────────────────────────────────────────────────────────

/** "2024-03-30" → "30/03/2024" */
export function formatDateShort(date: string): string {
  return m(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
}

/** "2024-03-30" → "sábado, 30 de março" */
export function formatDateLong(date: string): string {
  return m(date, 'YYYY-MM-DD').format('dddd, D [de] MMMM');
}

/** "2024-03-30" → "30 de março de 2024" */
export function formatDateFull(date: string): string {
  return m(date, 'YYYY-MM-DD').format('D [de] MMMM [de] YYYY');
}

/** ISO datetime → "30/03/2024 14:35" */
export function formatDateTime(iso: string): string {
  return m(iso).format('DD/MM/YYYY HH:mm');
}

// ─── Generators ───────────────────────────────────────────────────────────────

/** Retorna a data de hoje no formato "YYYY-MM-DD" */
export function todayISO(): string {
  return moment().format('YYYY-MM-DD');
}

/** Retorna o início e fim da semana atual (segunda a domingo) */
export function getWeekRange(): { start: string; end: string } {
  return {
    start: moment().startOf('isoWeek').format('YYYY-MM-DD'),
    end:   moment().endOf('isoWeek').format('YYYY-MM-DD'),
  };
}

/** Retorna o início e fim do mês atual */
export function getMonthRange(): { start: string; end: string } {
  return {
    start: moment().startOf('month').format('YYYY-MM-DD'),
    end:   moment().endOf('month').format('YYYY-MM-DD'),
  };
}

/** Verifica se uma data ISO está dentro de um intervalo (inclusivo) */
export function isInRange(date: string, start: string, end: string): boolean {
  const d = m(date, 'YYYY-MM-DD');
  return d.isSameOrAfter(m(start, 'YYYY-MM-DD')) &&
         d.isSameOrBefore(m(end, 'YYYY-MM-DD'));
}
