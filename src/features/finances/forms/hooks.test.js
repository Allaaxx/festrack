import { describe, expect, it, vi } from 'vitest';

import { getEditTransactionFormDefaultValues } from '@/features/finances/forms/hooks';

vi.mock('@/features/finances/api/hooks', () => ({
  useCreateTransaction: vi.fn(),
  useEditTransaction: vi.fn(),
}));

describe('getEditTransactionFormDefaultValues', () => {
  it('parses YYYY-MM-DDT00:00:00.000Z transaction date as local civil date without shifting backward in UTC-3', () => {
    const defaults = getEditTransactionFormDefaultValues({
      id: 'tx-1',
      name: 'Compra',
      amount: '100.50',
      date: '2026-11-17T00:00:00.000Z',
      type: 'EXPENSE',
      event_id: null,
    });

    expect(defaults.date.getFullYear()).toBe(2026);
    expect(defaults.date.getMonth()).toBe(10);
    expect(defaults.date.getDate()).toBe(17);
  });

  it('parses YYYY-MM-DD transaction date as local civil date', () => {
    const defaults = getEditTransactionFormDefaultValues({
      id: 'tx-2',
      name: 'Venda',
      amount: '250.00',
      date: '2026-11-17',
      type: 'EARNING',
      event_id: null,
    });

    expect(defaults.date.getFullYear()).toBe(2026);
    expect(defaults.date.getMonth()).toBe(10);
    expect(defaults.date.getDate()).toBe(17);
  });
});
