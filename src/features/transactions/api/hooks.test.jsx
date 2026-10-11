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
} from '@/features/transactions/api/hooks';
import {
  BalanceService,
  TransactionService,
} from '@/features/transactions/api/services';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/features/transactions/api/services', () => ({
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
