import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { formatCurrency } from '@/helpers/currency';

import { parseEventDate } from './event';

/**
 * Calcula os totais financeiros (Receitas, Despesas, Investimentos e Saldo Líquido)
 * a partir das transações associadas a um evento.
 *
 * @param {Array<{ type: string, amount: number | string }>} [transactions=[]]
 * @returns {{
 *   earnings: number,
 *   expenses: number,
 *   investments: number,
 *   netBalance: number,
 * }}
 */
export const calculateEventFinancialTotals = (transactions = []) => {
  if (!Array.isArray(transactions)) {
    return { earnings: 0, expenses: 0, investments: 0, netBalance: 0 };
  }

  let earnings = 0;
  let expenses = 0;
  let investments = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction?.amount) || 0;
    const type = String(transaction?.type ?? '').toUpperCase();

    if (type === 'EARNING') {
      earnings += amount;
    } else if (type === 'EXPENSE') {
      expenses += amount;
    } else if (type === 'INVESTMENT') {
      investments += amount;
    }
  }

  const netBalance = earnings - (expenses + investments);

  return {
    earnings,
    expenses,
    investments,
    netBalance,
  };
};

/**
 * Formata a participação percentual de um valor em relação ao volume total do evento.
 *
 * @param {number} amount
 * @param {number} totalVolume
 * @returns {string}
 */
export const formatVolumeShare = (amount, totalVolume) => {
  if (!totalVolume || totalVolume <= 0) {
    return '0%';
  }
  const percentage = Math.round(((Number(amount) || 0) / totalVolume) * 100);
  return `${percentage}%`;
};

/**
 * Constrói a série cronológica de área ({ date, label, amount }) para um tipo de transação,
 * preenchendo com pontos base zero quando houver 0 ou 1 registro para garantir curva válida no Recharts.
 *
 * @param {Array<{ date?: string | Date, type: string, amount: number | string }>} [transactions=[]]
 * @param {'EARNING' | 'EXPENSE' | 'INVESTMENT' | string} targetType
 * @returns {Array<{ date: string, label: string, amount: number }>}
 */
export const buildTransactionTypeSeries = (transactions = [], targetType) => {
  const baselineEmpty = [
    { date: '', label: 'Início', amount: 0 },
    { date: '', label: 'Atual', amount: 0 },
  ];

  if (!Array.isArray(transactions) || !targetType) {
    return baselineEmpty;
  }

  const normalizedTarget = String(targetType).toUpperCase();
  const groupedByDate = new Map();

  for (const transaction of transactions) {
    const type = String(transaction?.type ?? '').toUpperCase();
    if (type !== normalizedTarget) {
      continue;
    }

    const amount = Number(transaction?.amount) || 0;
    const parsedDate = parseEventDate(transaction?.date);
    const sortKey = parsedDate ? format(parsedDate, 'yyyy-MM-dd') : '0000-00-00';
    const dateValue = parsedDate ? sortKey : '';
    const label = parsedDate
      ? format(parsedDate, 'dd/MM', { locale: ptBR })
      : 'Data';

    if (groupedByDate.has(sortKey)) {
      const current = groupedByDate.get(sortKey);
      current.amount = Math.round((current.amount + amount) * 100) / 100;
    } else {
      groupedByDate.set(sortKey, {
        date: dateValue,
        label,
        amount: Math.round(amount * 100) / 100,
      });
    }
  }

  const points = Array.from(groupedByDate.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, point]) => point);

  if (points.length === 0) {
    return baselineEmpty;
  }

  if (points.length === 1) {
    return [{ date: '', label: 'Início', amount: 0 }, points[0]];
  }

  return points;
};

/**
 * Constrói os dados consolidados dos cards de métricas de área do evento
 * (Receitas, Despesas e Investimentos), incluindo totais, participação no volume e séries cronológicas.
 *
 * @param {Array<{ date?: string | Date, type: string, amount: number | string }>} [transactions=[]]
 */
export const buildEventMetricCardsData = (transactions = []) => {
  const totals = calculateEventFinancialTotals(transactions);
  const totalVolume =
    Math.round((totals.earnings + totals.expenses + totals.investments) * 100) /
    100;

  const shares = {
    earnings: formatVolumeShare(totals.earnings, totalVolume),
    expenses: formatVolumeShare(totals.expenses, totalVolume),
    investments: formatVolumeShare(totals.investments, totalVolume),
  };

  const series = {
    earnings: buildTransactionTypeSeries(transactions, 'EARNING'),
    expenses: buildTransactionTypeSeries(transactions, 'EXPENSE'),
    investments: buildTransactionTypeSeries(transactions, 'INVESTMENT'),
  };

  const cards = [
    {
      id: 'earnings',
      testId: 'kpi-earnings',
      type: 'EARNING',
      variant: 'earning',
      title: 'Total de Receitas',
      amount: totals.earnings,
      value: formatCurrency(totals.earnings),
      badge: shares.earnings,
      comparison: 'do volume do evento',
      data: series.earnings,
    },
    {
      id: 'expenses',
      testId: 'kpi-expenses',
      type: 'EXPENSE',
      variant: 'expense',
      title: 'Total de Despesas',
      amount: totals.expenses,
      value: formatCurrency(totals.expenses),
      badge: shares.expenses,
      comparison: 'do volume do evento',
      data: series.expenses,
    },
    {
      id: 'investments',
      testId: 'kpi-investments',
      type: 'INVESTMENT',
      variant: 'investment',
      title: 'Total de Investimentos',
      amount: totals.investments,
      value: formatCurrency(totals.investments),
      badge: shares.investments,
      comparison: 'do volume do evento',
      data: series.investments,
    },
  ];

  return {
    totals: {
      ...totals,
      totalVolume,
    },
    shares,
    series,
    cards,
  };
};

