import { describe, expect, it } from 'vitest';

import { buildDailyChartData } from './chart';

describe('buildDailyChartData', () => {
  it('returns zero-filled daily records for an interval with no transactions', () => {
    const data = buildDailyChartData([], '2026-10-01', '2026-10-03');

    expect(data).toEqual([
      { date: '2026-10-01', entradas: 0, saidas: 0 },
      { date: '2026-10-02', entradas: 0, saidas: 0 },
      { date: '2026-10-03', entradas: 0, saidas: 0 },
    ]);
  });

  it('correctly categorizes EARNING as entradas and EXPENSE and INVESTMENT as saidas', () => {
    const transactions = [
      { id: '1', date: '2026-10-01', type: 'EARNING', amount: 500 },
      { id: '2', date: '2026-10-01', type: 'EXPENSE', amount: 150 },
      { id: '3', date: '2026-10-01', type: 'INVESTMENT', amount: 200 },
    ];

    const data = buildDailyChartData(transactions, '2026-10-01', '2026-10-01');

    expect(data).toEqual([{ date: '2026-10-01', entradas: 500, saidas: 350 }]);
  });

  it('supports INVESTIMENT type alias for saidas', () => {
    const transactions = [
      { id: '1', date: '2026-10-01', type: 'INVESTIMENT', amount: 300 },
    ];

    const data = buildDailyChartData(transactions, '2026-10-01', '2026-10-01');

    expect(data).toEqual([{ date: '2026-10-01', entradas: 0, saidas: 300 }]);
  });

  it('aggregates multiple transactions on the same day and zero-fills gap days chronologically', () => {
    const transactions = [
      { id: '1', date: '2026-10-01', type: 'EARNING', amount: 100 },
      { id: '2', date: '2026-10-01', type: 'EARNING', amount: 50.5 },
      { id: '3', date: '2026-10-04', type: 'EXPENSE', amount: 80 },
    ];

    const data = buildDailyChartData(transactions, '2026-10-01', '2026-10-05');

    expect(data).toEqual([
      { date: '2026-10-01', entradas: 150.5, saidas: 0 },
      { date: '2026-10-02', entradas: 0, saidas: 0 },
      { date: '2026-10-03', entradas: 0, saidas: 0 },
      { date: '2026-10-04', entradas: 0, saidas: 80 },
      { date: '2026-10-05', entradas: 0, saidas: 0 },
    ]);
  });

  it('ignores transactions outside the requested interval', () => {
    const transactions = [
      { id: '1', date: '2026-09-30', type: 'EARNING', amount: 999 },
      { id: '2', date: '2026-10-02', type: 'EARNING', amount: 200 },
      { id: '3', date: '2026-10-06', type: 'EXPENSE', amount: 999 },
    ];

    const data = buildDailyChartData(transactions, '2026-10-01', '2026-10-03');

    expect(data).toEqual([
      { date: '2026-10-01', entradas: 0, saidas: 0 },
      { date: '2026-10-02', entradas: 200, saidas: 0 },
      { date: '2026-10-03', entradas: 0, saidas: 0 },
    ]);
  });

  it('handles Date objects as startDate and endDate', () => {
    const transactions = [
      { id: '1', date: '2026-10-01', type: 'EARNING', amount: 300 },
    ];

    const start = new Date(2026, 9, 1);
    const end = new Date(2026, 9, 2);
    const data = buildDailyChartData(transactions, start, end);

    expect(data).toEqual([
      { date: '2026-10-01', entradas: 300, saidas: 0 },
      { date: '2026-10-02', entradas: 0, saidas: 0 },
    ]);
  });

  it('returns empty array when interval is invalid or missing', () => {
    expect(buildDailyChartData([], null, null)).toEqual([]);
    expect(buildDailyChartData([], '2026-10-05', '2026-10-01')).toEqual([]);
    expect(buildDailyChartData([], 'invalid-date', '2026-10-01')).toEqual([]);
  });

  it('handles undefined or null transactions gracefully', () => {
    expect(buildDailyChartData(null, '2026-10-01', '2026-10-02')).toEqual([
      { date: '2026-10-01', entradas: 0, saidas: 0 },
      { date: '2026-10-02', entradas: 0, saidas: 0 },
    ]);
  });
});
