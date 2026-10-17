import { eachDayOfInterval, format, isValid } from 'date-fns';

/**
 * Normaliza uma data para uma instância válida de Date local.
 *
 * @param {string | Date} val
 * @returns {Date | null}
 */
const parseLocalDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    return isValid(val) ? val : null;
  }
  if (typeof val === 'string') {
    const dateStr = val.length === 10 ? `${val}T00:00:00` : val;
    const parsed = new Date(dateStr);
    return isValid(parsed) ? parsed : null;
  }
  const fallback = new Date(val);
  return isValid(fallback) ? fallback : null;
};

/**
 * Extrai a chave de data no formato 'yyyy-MM-dd'.
 *
 * @param {string | Date} val
 * @returns {string}
 */
const getTransactionDateKey = (val) => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return val.slice(0, 10);
  }
  const date = parseLocalDate(val);
  return date ? format(date, 'yyyy-MM-dd') : '';
};

/**
 * Constrói a série diária de dados para o gráfico de fluxo de caixa,
 * agregando transações em 'entradas' e 'saidas' e preenchendo dias sem movimentação.
 *
 * @param {Array<{ date: string | Date, type: string, amount: number | string }>} [transactions=[]]
 * @param {string | Date} startDate
 * @param {string | Date} endDate
 * @returns {Array<{ date: string, entradas: number, saidas: number }>}
 */
export function buildDailyChartData(transactions = [], startDate, endDate) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (!start || !end || start > end) {
    return [];
  }

  let days;
  try {
    days = eachDayOfInterval({ start, end });
  } catch {
    return [];
  }

  const dailyMap = new Map();
  for (const day of days) {
    const dateKey = format(day, 'yyyy-MM-dd');
    dailyMap.set(dateKey, {
      date: dateKey,
      entradas: 0,
      saidas: 0,
    });
  }

  if (Array.isArray(transactions)) {
    for (const transaction of transactions) {
      const dateKey = getTransactionDateKey(transaction?.date);
      if (dailyMap.has(dateKey)) {
        const item = dailyMap.get(dateKey);
        const amount = Number(transaction?.amount) || 0;
        const type = String(transaction?.type ?? '').toUpperCase();

        if (type === 'EARNING') {
          item.entradas = Math.round((item.entradas + amount) * 100) / 100;
        } else if (
          type === 'EXPENSE' ||
          type === 'INVESTMENT' ||
          type === 'INVESTIMENT'
        ) {
          item.saidas = Math.round((item.saidas + amount) * 100) / 100;
        }
      }
    }
  }

  return Array.from(dailyMap.values());
}
