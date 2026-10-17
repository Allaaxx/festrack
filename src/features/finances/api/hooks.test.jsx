import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import {
  getTransactionsQueryKey,
  getUserBalanceQueryKey,
  useCreateTransaction,
  useDeleteTransaction,
  useEditTransaction,
  useGetTransactions,
  useGetUserBalance,
} from '@/features/finances/api/hooks';
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
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Transactions API Hooks - Unauthenticated & Null Safety', () => {
  let queryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGetUserBalance', () => {
    it('does not throw when user is null and query remains disabled', () => {
      useAuthContext.mockReturnValue({ user: null });

      const { result } = renderHook(
        () => useGetUserBalance({ from: '2026-01-01', to: '2026-01-31' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(BalanceService.getBalance).not.toHaveBeenCalled();
    });

    it('fetches balance when user and dates are provided', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      const mockBalance = { balance: 1000, earnings: 1500, expenses: 500 };
      BalanceService.getBalance.mockResolvedValue(mockBalance);

      const { result } = renderHook(
        () => useGetUserBalance({ from: '2026-01-01', to: '2026-01-31' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(BalanceService.getBalance).toHaveBeenCalledWith({
        from: '2026-01-01',
        to: '2026-01-31',
      });
      expect(result.current.data).toEqual(mockBalance);
    });
  });

  describe('getTransactionsQueryKey', () => {
    it('returns base key when no params are passed or dates incomplete', () => {
      expect(getTransactionsQueryKey({ userId: 'u1' })).toEqual([
        'getTransactions',
        'u1',
      ]);
      expect(
        getTransactionsQueryKey({ userId: 'u1', from: '2026-01-01' })
      ).toEqual(['getTransactions', 'u1']);
    });

    it('returns date range key when from and to are provided', () => {
      expect(
        getTransactionsQueryKey({
          userId: 'u1',
          from: '2026-01-01',
          to: '2026-01-31',
        })
      ).toEqual(['getTransactions', 'u1', '2026-01-01', '2026-01-31']);
    });

    it('returns isolated eventId key when eventId is provided', () => {
      expect(
        getTransactionsQueryKey({
          userId: 'u1',
          eventId: 'ev-123',
        })
      ).toEqual(['getTransactions', 'u1', { eventId: 'ev-123' }]);
    });
  });

  describe('useGetTransactions', () => {
    it('does not throw when user is null and query remains disabled', () => {
      useAuthContext.mockReturnValue({ user: null });

      const { result } = renderHook(
        () => useGetTransactions({ from: '2026-01-01', to: '2026-01-31' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(TransactionService.getAll).not.toHaveBeenCalled();
    });

    it('does not throw when user is null even if eventId is provided', () => {
      useAuthContext.mockReturnValue({ user: null });

      const { result } = renderHook(
        () => useGetTransactions({ eventId: 'ev-123' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(TransactionService.getAll).not.toHaveBeenCalled();
    });

    it('remains disabled when user is authenticated but neither eventId nor date ranges are provided', () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });

      const { result } = renderHook(() => useGetTransactions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(TransactionService.getAll).not.toHaveBeenCalled();
    });

    it('fetches transactions when user and dates are provided', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      const mockTransactions = [{ id: 'tx-1', amount: 100 }];
      TransactionService.getAll.mockResolvedValue(mockTransactions);

      const { result } = renderHook(
        () => useGetTransactions({ from: '2026-01-01', to: '2026-01-31' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(TransactionService.getAll).toHaveBeenCalledWith({
        from: '2026-01-01',
        to: '2026-01-31',
      });
      expect(result.current.data).toEqual(mockTransactions);
    });

    it('fetches transactions when user and eventId are provided', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      const mockTransactions = [{ id: 'tx-event-1', amount: 250 }];
      TransactionService.getAll.mockResolvedValue(mockTransactions);

      const { result } = renderHook(
        () => useGetTransactions({ eventId: 'ev-123' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(TransactionService.getAll).toHaveBeenCalledWith({
        eventId: 'ev-123',
      });
      expect(result.current.data).toEqual(mockTransactions);
    });
  });

  describe('Mutations with null safety on invalidateQueries', () => {
    it('useCreateTransaction succeeds and safely invalidates when user is null', async () => {
      useAuthContext.mockReturnValue({ user: null });
      TransactionService.create.mockResolvedValue({ id: 'tx-new' });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateTransaction(), {
        wrapper,
      });

      result.current.mutate({ name: 'Coffee', amount: 10 });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getUserBalanceQueryKey({ userId: undefined }),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getTransactionsQueryKey({ userId: undefined }),
      });
    });

    it('useEditTransaction succeeds and safely invalidates when user is null', async () => {
      useAuthContext.mockReturnValue({ user: null });
      TransactionService.update.mockResolvedValue({ id: 'tx-1' });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useEditTransaction(), {
        wrapper,
      });

      result.current.mutate({ id: 'tx-1', name: 'Coffee edit' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getUserBalanceQueryKey({ userId: undefined }),
      });
    });

    it('useDeleteTransaction succeeds and safely invalidates when user is null', async () => {
      useAuthContext.mockReturnValue({ user: null });
      TransactionService.delete.mockResolvedValue({ success: true });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteTransaction(), {
        wrapper,
      });

      result.current.mutate({ id: 'tx-1' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getUserBalanceQueryKey({ userId: undefined }),
      });
    });
  });
});
