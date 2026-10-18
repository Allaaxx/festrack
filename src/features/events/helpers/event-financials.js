import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { formatCurrency } from '@/helpers/currency';

import { getEventStatus, getEventStatusLabel, parseEventDate } from './event';

const normalizeTransactionType = (rawType) => {
  const upper = String(rawType ?? '').toUpperCase();
  return upper === 'INVESTIMENT' ? 'INVESTMENT' : upper;
};

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
    const type = normalizeTransactionType(transaction?.type);

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

  const normalizedTarget = normalizeTransactionType(targetType);
  const groupedByDate = new Map();

  for (const transaction of transactions) {
    const type = normalizeTransactionType(transaction?.type);
    if (type !== normalizedTarget) {
      continue;
    }

    const amount = Number(transaction?.amount) || 0;
    const parsedDate = parseEventDate(transaction?.date);
    const sortKey = parsedDate
      ? format(parsedDate, 'yyyy-MM-dd')
      : '0000-00-00';
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

/**
 * Constrói os 4 indicadores operacionais do evento (StatCards) em português (BR):
 * 1. Status do Evento (stat-status)
 * 2. Total de Transações (stat-transactions-count)
 * 3. Ticket Médio de Despesa (stat-average-expense)
 * 4. Maior Despesa (stat-max-expense)
 *
 * @param {{ startDate?: Date | string, endDate?: Date | string } | null | undefined} event
 * @param {Array<{ name?: string, type?: string, amount?: number | string }>} [transactions=[]]
 */
export const buildEventOperationalStats = (event, transactions = []) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const today = startOfDay(new Date());
  const parsedStart = parseEventDate(event?.startDate);
  const parsedEnd = parseEventDate(event?.endDate);
  const start = startOfDay(parsedStart ?? today);
  const end = startOfDay(parsedEnd ?? start);

  const statusKey = event?.startDate ? getEventStatus(event) : 'scheduled';
  const statusLabel = getEventStatusLabel(statusKey);

  let statusBadge = 'Em curso';
  if (statusKey === 'scheduled') {
    const daysUntilStart = Math.max(1, differenceInCalendarDays(start, today));
    statusBadge =
      daysUntilStart === 1 ? 'Falta 1 dia' : `Faltam ${daysUntilStart} dias`;
  } else if (statusKey === 'completed') {
    statusBadge = 'Concluído';
  }

  const durationDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const durationLabel = durationDays === 1 ? '1 dia' : `${durationDays} dias`;

  const totalCount = safeTransactions.length;

  const expenseTransactions = safeTransactions.filter(
    (tx) => String(tx?.type ?? '').toUpperCase() === 'EXPENSE'
  );
  const expenseCount = expenseTransactions.length;
  const totalExpenseAmount = expenseTransactions.reduce(
    (sum, tx) => sum + (Number(tx?.amount) || 0),
    0
  );
  const averageExpense =
    expenseCount > 0
      ? Math.round((totalExpenseAmount / expenseCount) * 100) / 100
      : 0;

  let maxExpenseAmount = 0;
  let maxExpenseName = '';
  for (const tx of expenseTransactions) {
    const amount = Number(tx?.amount) || 0;
    if (amount > maxExpenseAmount) {
      maxExpenseAmount = amount;
      maxExpenseName = tx?.name ? String(tx.name).trim() : '';
    }
  }

  return [
    {
      id: 'status',
      testId: 'stat-status',
      icon: 'TicketCheck',
      trend: durationLabel,
      trendUp: statusKey !== 'completed',
      value: statusLabel,
      title: 'Status do Evento',
      badge: statusBadge,
    },
    {
      id: 'transactions-count',
      testId: 'stat-transactions-count',
      icon: 'ShoppingCart',
      trend: totalCount > 0 ? `+${totalCount}` : '0',
      trendUp: totalCount > 0,
      value: String(totalCount),
      title: 'Total de Transações',
      badge: totalCount === 1 ? '1 lançamento' : `${totalCount} lançamentos`,
    },
    {
      id: 'average-expense',
      testId: 'stat-average-expense',
      icon: 'DollarSign',
      trend: expenseCount === 1 ? '1 despesa' : `${expenseCount} despesas`,
      trendUp: false,
      amount: averageExpense,
      value: formatCurrency(averageExpense),
      title: 'Ticket Médio de Despesa',
      badge: 'Média por gasto',
    },
    {
      id: 'max-expense',
      testId: 'stat-max-expense',
      icon: 'BookMarked',
      trend: maxExpenseAmount > 0 ? 'Pico' : '0%',
      trendUp: false,
      amount: maxExpenseAmount,
      value: formatCurrency(maxExpenseAmount),
      title: 'Maior Despesa',
      badge: maxExpenseName || 'Nenhuma despesa',
    },
  ];
};

/**
 * Constrói os dados do card "Balanço do Evento" (TotalRevenueCard):
 * - Totais consolidados de Entradas (EARNING), Saídas (EXPENSE + INVESTMENT) e Saldo Líquido
 * - Série cronológica de barras ({ date, label, entradas, saidas })
 * - Percentual e segmentos do medidor circular (gauge) de comprometimento das entradas
 *
 * @param {Array<{ date?: string | Date, type: string, amount: number | string }>} [transactions=[]]
 */
export const buildEventBalanceOverviewData = (transactions = []) => {
  const totals = calculateEventFinancialTotals(transactions);
  const entradas = Math.round(totals.earnings * 100) / 100;
  const saidas = Math.round((totals.expenses + totals.investments) * 100) / 100;
  const netBalance = Math.round(totals.netBalance * 100) / 100;

  let executionPercentage = 0;
  if (entradas > 0) {
    executionPercentage = Math.min(
      100,
      Math.max(0, Math.round((saidas / entradas) * 100))
    );
  } else if (saidas > 0) {
    executionPercentage = 100;
  }

  const groupedByDate = new Map();
  if (Array.isArray(transactions)) {
    for (const transaction of transactions) {
      const type = normalizeTransactionType(transaction?.type);
      if (type !== 'EARNING' && type !== 'EXPENSE' && type !== 'INVESTMENT') {
        continue;
      }

      const amount = Number(transaction?.amount) || 0;
      const parsedDate = parseEventDate(transaction?.date);
      const sortKey = parsedDate
        ? format(parsedDate, 'yyyy-MM-dd')
        : '0000-00-00';
      const dateValue = parsedDate ? sortKey : '';
      const label = parsedDate
        ? format(parsedDate, 'dd/MM', { locale: ptBR })
        : 'Data';

      if (!groupedByDate.has(sortKey)) {
        groupedByDate.set(sortKey, {
          date: dateValue,
          label,
          entradas: 0,
          saidas: 0,
        });
      }

      const current = groupedByDate.get(sortKey);
      if (type === 'EARNING') {
        current.entradas = Math.round((current.entradas + amount) * 100) / 100;
      } else {
        current.saidas = Math.round((current.saidas + amount) * 100) / 100;
      }
    }
  }

  const sortedBarPoints = Array.from(groupedByDate.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, point]) => point);

  const barData =
    sortedBarPoints.length > 0
      ? sortedBarPoints
      : [{ date: '', label: 'Sem registros', entradas: 0, saidas: 0 }];

  const totalSegments = 25;
  const activeSegments = Math.round(
    (executionPercentage / 100) * totalSegments
  );
  const pieData = Array.from({ length: totalSegments }, (_, index) => {
    const isFilled = index < activeSegments;
    const fill = isFilled
      ? 'var(--primary)'
      : 'color-mix(in oklab, var(--primary) 12%, var(--background))';

    return {
      name: `segment-${index}`,
      value: 1,
      fill,
    };
  });

  return {
    entradas,
    saidas,
    netBalance,
    executionPercentage,
    barData,
    pieData,
  };
};
