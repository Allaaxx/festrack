import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { endOfMonth, format, startOfMonth, subDays } from 'date-fns';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getStoredFiltersKey,
  LOCAL_STORAGE_FINANCE_FILTERS_KEY,
} from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import { useFinancePage } from '@/features/finances';
import {
  BalanceService,
  TransactionService,
} from '@/features/finances/api/services';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/features/finances/api/services', () => ({
  BalanceService: {
    getBalance: vi.fn(),
  },
  TransactionService: {
    getAll: vi.fn(),
  },
}));

describe('useFinancePage Hook', () => {
  const mockUser = { id: 'usr-123', name: 'John Doe' };
  const storageKey = getStoredFiltersKey(
    mockUser.id,
    LOCAL_STORAGE_FINANCE_FILTERS_KEY
  );

  let queryClient;

  const createWrapper = (initialEntries = ['/finances']) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  const fixedDate = new Date(2026, 9, 15, 12, 0, 0); // 2026-10-15

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(fixedDate);
    localStorage.clear();
    vi.clearAllMocks();

    useAuthContext.mockReturnValue({ user: mockUser });
    BalanceService.getBalance.mockResolvedValue({
      balance: 5000,
      earnings: 8000,
      expenses: 3000,
      investiments: 0,
    });
    TransactionService.getAll.mockResolvedValue([
      { id: 'tx-1', name: 'Freelance', amount: 8000, type: 'EARNING' },
      { id: 'tx-2', name: 'Aluguel', amount: 3000, type: 'EXPENSE' },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Default initialization', () => {
    it('initializes with default current month date range and standard pagination when storage and URL are empty', async () => {
      const expectedFrom = format(startOfMonth(fixedDate), 'yyyy-MM-dd');
      const expectedTo = format(endOfMonth(fixedDate), 'yyyy-MM-dd');

      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      expect(result.current.params).toEqual({
        from: expectedFrom,
        to: expectedTo,
        q: '',
        page: 0,
        pageSize: 10,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(BalanceService.getBalance).toHaveBeenCalledWith({
        from: expectedFrom,
        to: expectedTo,
      });
      expect(TransactionService.getAll).toHaveBeenCalledWith({
        from: expectedFrom,
        to: expectedTo,
      });

      expect(result.current.balance).toEqual({
        balance: 5000,
        earnings: 8000,
        expenses: 3000,
        investiments: 0,
      });
      expect(result.current.transactions).toHaveLength(2);
      expect(result.current.isError).toBe(false);
    });

    it('persists initial default parameters to user-scoped localStorage', async () => {
      const expectedFrom = format(startOfMonth(fixedDate), 'yyyy-MM-dd');
      const expectedTo = format(endOfMonth(fixedDate), 'yyyy-MM-dd');

      renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        expect(stored.from).toBe(expectedFrom);
        expect(stored.to).toBe(expectedTo);
        expect(stored.page).toBe(0);
        expect(stored.pageSize).toBe(10);
      });
    });
  });

  describe('LocalStorage and URL parameter synchronization', () => {
    it('restores filters from localStorage when URL has no search params', async () => {
      const savedFilters = {
        from: '2026-05-01',
        to: '2026-05-31',
        q: 'supermercado',
        page: 2,
        pageSize: 20,
      };
      localStorage.setItem(storageKey, JSON.stringify(savedFilters));

      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      expect(result.current.params).toEqual({
        from: '2026-05-01',
        to: '2026-05-31',
        q: 'supermercado',
        page: 2,
        pageSize: 20,
      });

      await waitFor(() => {
        expect(BalanceService.getBalance).toHaveBeenCalledWith({
          from: '2026-05-01',
          to: '2026-05-31',
        });
      });
    });

    it('prioritizes URL search parameters over localStorage', async () => {
      const savedFilters = {
        from: '2026-01-01',
        to: '2026-01-31',
        q: 'old query',
        page: 0,
        pageSize: 10,
      };
      localStorage.setItem(storageKey, JSON.stringify(savedFilters));

      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper([
          '/finances?from=2026-08-01&to=2026-08-31&q=salario&page=1&pageSize=50',
        ]),
      });

      expect(result.current.params).toEqual({
        from: '2026-08-01',
        to: '2026-08-31',
        q: 'salario',
        page: 1,
        pageSize: 50,
      });

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        expect(stored.from).toBe('2026-08-01');
        expect(stored.to).toBe('2026-08-31');
        expect(stored.q).toBe('salario');
        expect(stored.page).toBe('1');
        expect(stored.pageSize).toBe('50');
      });
    });

    it('falls back to default current month when localStorage contains invalid date values', async () => {
      const corruptedFilters = {
        from: 'invalid-date',
        to: 'invalid-date',
        q: 'test',
        page: 0,
        pageSize: 10,
      };
      localStorage.setItem(storageKey, JSON.stringify(corruptedFilters));

      const expectedFrom = format(startOfMonth(fixedDate), 'yyyy-MM-dd');
      const expectedTo = format(endOfMonth(fixedDate), 'yyyy-MM-dd');

      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      expect(result.current.params.from).toBe(expectedFrom);
      expect(result.current.params.to).toBe(expectedTo);
    });
  });

  describe('Handlers and state updates', () => {
    it('updates date range via setDateRange with object { from, to }', async () => {
      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handlers.setDateRange({
          from: '2026-03-01',
          to: '2026-03-31',
        });
      });

      expect(result.current.params.from).toBe('2026-03-01');
      expect(result.current.params.to).toBe('2026-03-31');
    });

    it('updates date range via setDateRange with Date instances', async () => {
      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handlers.setDateRange({
          from: new Date(2026, 2, 1),
          to: new Date(2026, 2, 31),
        });
      });

      expect(result.current.params.from).toBe('2026-03-01');
      expect(result.current.params.to).toBe('2026-03-31');
    });

    it('calculates proper 7d preset range ending on current date', async () => {
      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handlers.setPresetRange('7d');
      });

      const expectedTo = format(fixedDate, 'yyyy-MM-dd');
      const expectedFrom = format(subDays(fixedDate, 6), 'yyyy-MM-dd');

      expect(result.current.params.to).toBe(expectedTo);
      expect(result.current.params.from).toBe(expectedFrom);
    });

    it('calculates proper 30d preset range ending on current date', async () => {
      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handlers.setPresetRange('30d');
      });

      const expectedTo = format(fixedDate, 'yyyy-MM-dd');
      const expectedFrom = format(subDays(fixedDate, 29), 'yyyy-MM-dd');

      expect(result.current.params.to).toBe(expectedTo);
      expect(result.current.params.from).toBe(expectedFrom);
    });

    it('calculates proper 90d preset range ending on current date', async () => {
      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handlers.setPresetRange('90d');
      });

      const expectedTo = format(fixedDate, 'yyyy-MM-dd');
      const expectedFrom = format(subDays(fixedDate, 89), 'yyyy-MM-dd');

      expect(result.current.params.to).toBe(expectedTo);
      expect(result.current.params.from).toBe(expectedFrom);
    });

    it('resets page to 0 when setSearchQuery is called', async () => {
      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper([
          '/finances?from=2026-10-01&to=2026-10-31&page=4&pageSize=10',
        ]),
      });

      expect(result.current.params.page).toBe(4);

      act(() => {
        result.current.handlers.setSearchQuery('cinema');
      });

      expect(result.current.params.q).toBe('cinema');
      expect(result.current.params.page).toBe(0);
    });

    it('updates page and pageSize via handlers', async () => {
      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handlers.setPage(3);
      });
      expect(result.current.params.page).toBe(3);

      act(() => {
        result.current.handlers.setPageSize(25);
      });
      expect(result.current.params.pageSize).toBe(25);
    });
  });

  describe('Query coordination and lifecycle states', () => {
    it('aggregates loading and error flags from both balance and transactions queries', async () => {
      BalanceService.getBalance.mockReturnValue(new Promise(() => {})); // pending
      TransactionService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(result.current.balance).toBeNull();
      expect(result.current.transactions).toEqual([]);
    });

    it('reports error when a query rejects', async () => {
      BalanceService.getBalance.mockRejectedValue(new Error('Network error'));
      TransactionService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('refetches both balance and transactions queries when refetch is called', async () => {
      const { result } = renderHook(() => useFinancePage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(BalanceService.getBalance).toHaveBeenCalledTimes(1);
      expect(TransactionService.getAll).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(BalanceService.getBalance).toHaveBeenCalledTimes(2);
      expect(TransactionService.getAll).toHaveBeenCalledTimes(2);
    });
  });
});
