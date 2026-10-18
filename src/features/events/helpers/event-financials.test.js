import { describe, expect, it } from 'vitest';

import {
  buildEventBalanceOverviewData,
  buildEventMetricCardsData,
  buildEventOperationalStats,
  buildTransactionTypeSeries,
  calculateEventFinancialTotals,
} from './event-financials';

describe('calculateEventFinancialTotals', () => {
  it('returns zero totals when transactions array is empty or undefined', () => {
    expect(calculateEventFinancialTotals([])).toEqual({
      earnings: 0,
      expenses: 0,
      investments: 0,
      netBalance: 0,
    });
    expect(calculateEventFinancialTotals(undefined)).toEqual({
      earnings: 0,
      expenses: 0,
      investments: 0,
      netBalance: 0,
    });
    expect(calculateEventFinancialTotals(null)).toEqual({
      earnings: 0,
      expenses: 0,
      investments: 0,
      netBalance: 0,
    });
  });

  it('correctly aggregates EARNING transactions into Total de Receitas', () => {
    const transactions = [
      { id: '1', type: 'EARNING', amount: 500 },
      { id: '2', type: 'EARNING', amount: 350.5 },
    ];

    const result = calculateEventFinancialTotals(transactions);

    expect(result.earnings).toBe(850.5);
    expect(result.expenses).toBe(0);
    expect(result.investments).toBe(0);
    expect(result.netBalance).toBe(850.5);
  });

  it('correctly aggregates EXPENSE transactions into Total de Despesas', () => {
    const transactions = [
      { id: '1', type: 'EXPENSE', amount: 150 },
      { id: '2', type: 'EXPENSE', amount: 75.25 },
    ];

    const result = calculateEventFinancialTotals(transactions);

    expect(result.earnings).toBe(0);
    expect(result.expenses).toBe(225.25);
    expect(result.investments).toBe(0);
    expect(result.netBalance).toBe(-225.25);
  });

  it('correctly aggregates INVESTMENT transactions into Total de Investimentos', () => {
    const transactions = [
      { id: '1', type: 'INVESTMENT', amount: 1000 },
      { id: '2', type: 'INVESTMENT', amount: 250 },
    ];

    const result = calculateEventFinancialTotals(transactions);

    expect(result.earnings).toBe(0);
    expect(result.expenses).toBe(0);
    expect(result.investments).toBe(1250);
    expect(result.netBalance).toBe(-1250);
  });

  it('calculates Net Balance as EARNING - (EXPENSE + INVESTMENT)', () => {
    const transactions = [
      { id: '1', type: 'EARNING', amount: 5000 },
      { id: '2', type: 'EXPENSE', amount: 1200 },
      { id: '3', type: 'EXPENSE', amount: 800 },
      { id: '4', type: 'INVESTMENT', amount: 1500 },
    ];

    const result = calculateEventFinancialTotals(transactions);

    expect(result.earnings).toBe(5000);
    expect(result.expenses).toBe(2000);
    expect(result.investments).toBe(1500);
    // 5000 - (2000 + 1500) = 1500
    expect(result.netBalance).toBe(1500);
  });

  it('handles string amounts and lowercase/mixed transaction types defensively', () => {
    const transactions = [
      { id: '1', type: 'earning', amount: '1200.50' },
      { id: '2', type: 'expense', amount: '200.50' },
      { id: '3', type: 'Investment', amount: '500' },
      { id: '4', type: 'UNKNOWN', amount: 999 },
      { id: '5', type: 'EARNING', amount: null },
    ];

    const result = calculateEventFinancialTotals(transactions);

    expect(result.earnings).toBe(1200.5);
    expect(result.expenses).toBe(200.5);
    expect(result.investments).toBe(500);
    expect(result.netBalance).toBe(500);
  });

  it('normalizes the backend INVESTIMENT alias into INVESTMENT across totals, series, and balance overview', () => {
    const transactions = [
      {
        id: '1',
        type: 'INVESTIMENT',
        amount: 600,
        date: '2026-12-04T12:00:00.000Z',
      },
      {
        id: '2',
        type: 'EARNING',
        amount: 1000,
        date: '2026-12-04T10:00:00.000Z',
      },
    ];

    const totals = calculateEventFinancialTotals(transactions);
    expect(totals.investments).toBe(600);
    expect(totals.netBalance).toBe(400);

    const series = buildTransactionTypeSeries(transactions, 'INVESTMENT');
    expect(series).toEqual([
      { date: '', label: 'Início', amount: 0 },
      { date: '2026-12-04', label: '04/12', amount: 600 },
    ]);

    const overview = buildEventBalanceOverviewData(transactions);
    expect(overview.saidas).toBe(600);
    expect(overview.netBalance).toBe(400);
  });
});

describe('buildTransactionTypeSeries', () => {
  it('returns two baseline zero points when there are no matching transactions', () => {
    const series = buildTransactionTypeSeries([], 'EARNING');

    expect(series).toEqual([
      { date: '', label: 'Início', amount: 0 },
      { date: '', label: 'Atual', amount: 0 },
    ]);
  });

  it('pads a single transaction with a leading baseline zero point so AreaChart renders a curve', () => {
    const transactions = [
      {
        id: 'tx-1',
        type: 'EXPENSE',
        amount: 1500,
        date: '2026-12-02T12:00:00.000Z',
      },
    ];

    const series = buildTransactionTypeSeries(transactions, 'EXPENSE');

    expect(series).toEqual([
      { date: '', label: 'Início', amount: 0 },
      { date: '2026-12-02', label: '02/12', amount: 1500 },
    ]);
  });

  it('groups multiple transactions on the same date and sorts dates chronologically', () => {
    const transactions = [
      {
        id: 'tx-3',
        type: 'EARNING',
        amount: 800,
        date: '2026-12-10T15:00:00.000Z',
      },
      {
        id: 'tx-1',
        type: 'EARNING',
        amount: 1200,
        date: '2026-12-01T10:00:00.000Z',
      },
      {
        id: 'tx-2',
        type: 'EARNING',
        amount: 300,
        date: '2026-12-01T18:00:00.000Z',
      },
      {
        id: 'tx-other',
        type: 'EXPENSE',
        amount: 500,
        date: '2026-12-05T12:00:00.000Z',
      },
    ];

    const series = buildTransactionTypeSeries(transactions, 'EARNING');

    expect(series).toEqual([
      { date: '2026-12-01', label: '01/12', amount: 1500 },
      { date: '2026-12-10', label: '10/12', amount: 800 },
    ]);
  });
});

describe('buildEventMetricCardsData', () => {
  it('returns 0% volume shares and baseline series when transactions list is empty', () => {
    const data = buildEventMetricCardsData([]);

    expect(data.totals).toEqual({
      earnings: 0,
      expenses: 0,
      investments: 0,
      netBalance: 0,
      totalVolume: 0,
    });
    expect(data.shares).toEqual({
      earnings: '0%',
      expenses: '0%',
      investments: '0%',
    });
    expect(data.cards).toHaveLength(3);
    expect(data.cards.map((c) => c.testId)).toEqual([
      'kpi-earnings',
      'kpi-expenses',
      'kpi-investments',
    ]);
    expect(data.cards.map((c) => c.badge)).toEqual(['0%', '0%', '0%']);
  });

  it('computes volume percentage shares and chronological series per transaction type', () => {
    const transactions = [
      {
        id: 'tx-1',
        type: 'EARNING',
        amount: 2900,
        date: '2026-12-03T12:00:00.000Z',
      },
      {
        id: 'tx-2',
        type: 'EXPENSE',
        amount: 1500,
        date: '2026-12-02T12:00:00.000Z',
      },
      {
        id: 'tx-3',
        type: 'INVESTMENT',
        amount: 600,
        date: '2026-12-04T12:00:00.000Z',
      },
    ];

    const data = buildEventMetricCardsData(transactions);

    // totalVolume = 2900 + 1500 + 600 = 5000
    expect(data.totals.totalVolume).toBe(5000);
    expect(data.totals.netBalance).toBe(800);
    expect(data.shares).toEqual({
      earnings: '58%',
      expenses: '30%',
      investments: '12%',
    });

    const [earningsCard, expensesCard, investmentsCard] = data.cards;
    expect(earningsCard.title).toBe('Total de Receitas');
    expect(earningsCard.badge).toBe('58%');
    expect(earningsCard.comparison).toBe('do volume do evento');
    expect(earningsCard.variant).toBe('earning');

    expect(expensesCard.title).toBe('Total de Despesas');
    expect(expensesCard.badge).toBe('30%');
    expect(expensesCard.variant).toBe('expense');

    expect(investmentsCard.title).toBe('Total de Investimentos');
    expect(investmentsCard.badge).toBe('12%');
    expect(investmentsCard.variant).toBe('investment');
  });
});

describe('buildEventOperationalStats', () => {
  const futureEvent = {
    id: 'ev-future',
    name: 'Festival de Verão',
    startDate: '2099-12-01T00:00:00.000Z',
    endDate: '2099-12-05T23:59:59.000Z',
  };

  const ongoingEvent = {
    id: 'ev-ongoing',
    name: 'Feira Gastronômica',
    startDate: '2020-01-01T00:00:00.000Z',
    endDate: '2099-12-31T23:59:59.000Z',
  };

  const completedEvent = {
    id: 'ev-completed',
    name: 'Congresso Passado',
    startDate: '2020-01-01T00:00:00.000Z',
    endDate: '2020-01-03T23:59:59.000Z',
  };

  it('safely handles zero transactions without NaN and returns R$ 0,00 defaults in pt-BR', () => {
    const stats = buildEventOperationalStats(futureEvent, []);

    expect(stats).toHaveLength(4);
    expect(stats.map((s) => s.testId)).toEqual([
      'stat-status',
      'stat-transactions-count',
      'stat-average-expense',
      'stat-max-expense',
    ]);

    const [statusCard, countCard, avgExpenseCard, maxExpenseCard] = stats;

    expect(statusCard.title).toBe('Status do Evento');
    expect(statusCard.value).toBe('Agendado');
    expect(statusCard.badge).toMatch(/^Faltam \d+ dias$/);

    expect(countCard.title).toBe('Total de Transações');
    expect(countCard.value).toBe('0');
    expect(countCard.badge).toBe('0 lançamentos');

    expect(avgExpenseCard.title).toBe('Ticket Médio de Despesa');
    expect(avgExpenseCard.value).toMatch(/R\$\s*0,00/);
    expect(avgExpenseCard.badge).toBe('Média por gasto');

    expect(maxExpenseCard.title).toBe('Maior Despesa');
    expect(maxExpenseCard.value).toMatch(/R\$\s*0,00/);
    expect(maxExpenseCard.badge).toBe('Nenhuma despesa');
  });

  it('computes status, transaction count, average expense, and max expense with transaction name', () => {
    const transactions = [
      { id: '1', name: 'Ingresso Lote 1', type: 'EARNING', amount: 3000 },
      { id: '2', name: 'Buffet Executivo', type: 'EXPENSE', amount: 1800 },
      { id: '3', name: 'Som e Iluminação', type: 'EXPENSE', amount: 600 },
      { id: '4', name: 'Tráfego Pago', type: 'INVESTMENT', amount: 400 },
    ];

    const stats = buildEventOperationalStats(ongoingEvent, transactions);
    const [statusCard, countCard, avgExpenseCard, maxExpenseCard] = stats;

    expect(statusCard.value).toBe('Em andamento');
    expect(statusCard.badge).toBe('Em curso');

    expect(countCard.value).toBe('4');
    expect(countCard.badge).toBe('4 lançamentos');

    // Average of 1800 and 600 = 1200
    expect(avgExpenseCard.value).toMatch(/R\$\s*1\.200,00/);
    expect(avgExpenseCard.badge).toBe('Média por gasto');

    // Max expense is Buffet Executivo (1800)
    expect(maxExpenseCard.value).toMatch(/R\$\s*1\.800,00/);
    expect(maxExpenseCard.badge).toBe('Buffet Executivo');
  });

  it('formats singular 1 lançamento and completed status badge accurately', () => {
    const transactions = [
      { id: '1', name: 'Aluguel do Espaço', type: 'EXPENSE', amount: 2500 },
    ];

    const stats = buildEventOperationalStats(completedEvent, transactions);
    const [statusCard, countCard, avgExpenseCard, maxExpenseCard] = stats;

    expect(statusCard.value).toBe('Finalizado');
    expect(statusCard.badge).toBe('Concluído');

    expect(countCard.value).toBe('1');
    expect(countCard.badge).toBe('1 lançamento');

    expect(avgExpenseCard.value).toMatch(/R\$\s*2\.500,00/);
    expect(maxExpenseCard.value).toMatch(/R\$\s*2\.500,00/);
    expect(maxExpenseCard.badge).toBe('Aluguel do Espaço');
  });
});

describe('buildEventBalanceOverviewData', () => {
  it('returns zero totals, baseline barData, and 0% execution when transactions list is empty', () => {
    const overview = buildEventBalanceOverviewData([]);

    expect(overview.entradas).toBe(0);
    expect(overview.saidas).toBe(0);
    expect(overview.netBalance).toBe(0);
    expect(overview.executionPercentage).toBe(0);
    expect(overview.barData).toEqual([
      { date: '', label: 'Sem registros', entradas: 0, saidas: 0 },
    ]);
    expect(overview.pieData).toHaveLength(25);
  });

  it('groups transactions chronologically into entradas vs saidas and computes consumption gauge ratio', () => {
    const transactions = [
      {
        id: 'tx-2',
        type: 'EXPENSE',
        amount: 1500,
        date: '2026-12-03T12:00:00.000Z',
      },
      {
        id: 'tx-1',
        type: 'EARNING',
        amount: 4000,
        date: '2026-12-01T12:00:00.000Z',
      },
      {
        id: 'tx-3',
        type: 'INVESTMENT',
        amount: 500,
        date: '2026-12-03T15:00:00.000Z',
      },
    ];

    const overview = buildEventBalanceOverviewData(transactions);

    // entradas = 4000, saidas = 1500 + 500 = 2000, netBalance = 2000
    expect(overview.entradas).toBe(4000);
    expect(overview.saidas).toBe(2000);
    expect(overview.netBalance).toBe(2000);
    // 2000 / 4000 = 50%
    expect(overview.executionPercentage).toBe(50);
    expect(overview.barData).toEqual([
      { date: '2026-12-01', label: '01/12', entradas: 4000, saidas: 0 },
      { date: '2026-12-03', label: '03/12', entradas: 0, saidas: 2000 },
    ]);
    expect(overview.pieData).toHaveLength(25);
  });

  it('clamps executionPercentage to 100 when saidas exceed entradas', () => {
    const transactions = [
      {
        id: 'tx-1',
        type: 'EXPENSE',
        amount: 900,
        date: '2026-12-02T12:00:00.000Z',
      },
    ];

    const overview = buildEventBalanceOverviewData(transactions);

    expect(overview.entradas).toBe(0);
    expect(overview.saidas).toBe(900);
    expect(overview.netBalance).toBe(-900);
    expect(overview.executionPercentage).toBe(100);
  });
});
