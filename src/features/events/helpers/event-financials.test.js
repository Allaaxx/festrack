import { describe, expect, it } from 'vitest';

import { calculateEventFinancialTotals } from './event-financials';

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
});
