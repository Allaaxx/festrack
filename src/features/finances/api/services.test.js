import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BalanceService,
  TransactionService,
} from '@/features/finances/api/services';
import protectedApi from '@/lib/axios';

vi.mock('@/lib/axios', () => {
  const mockProtectedApi = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mockProtectedApi,
    protectedApi: mockProtectedApi,
  };
});

describe('TransactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sends from and to query parameters when provided', async () => {
      const mockTransactions = [{ id: 'tx-1', name: 'Salário' }];
      protectedApi.get.mockResolvedValue({ data: mockTransactions });

      const result = await TransactionService.getAll({
        from: '2026-01-01',
        to: '2026-01-31',
      });

      expect(protectedApi.get).toHaveBeenCalledWith(
        'transactions/me?from=2026-01-01&to=2026-01-31'
      );
      expect(result).toEqual(mockTransactions);
    });

    it('sends event_id query parameter when eventId is provided', async () => {
      const mockTransactions = [{ id: 'tx-2', name: 'Passagem Aérea' }];
      protectedApi.get.mockResolvedValue({ data: mockTransactions });

      const result = await TransactionService.getAll({
        eventId: 'event-uuid-123',
      });

      expect(protectedApi.get).toHaveBeenCalledWith(
        'transactions/me?event_id=event-uuid-123'
      );
      expect(result).toEqual(mockTransactions);
    });

    it('sends event_id, from, and to when all are provided', async () => {
      const mockTransactions = [{ id: 'tx-3', name: 'Hotel' }];
      protectedApi.get.mockResolvedValue({ data: mockTransactions });

      const result = await TransactionService.getAll({
        from: '2026-02-01',
        to: '2026-02-28',
        eventId: 'event-uuid-456',
      });

      expect(protectedApi.get).toHaveBeenCalledWith(
        expect.stringMatching(
          /transactions\/me\?(?=.*event_id=event-uuid-456)(?=.*from=2026-02-01)(?=.*to=2026-02-28)/
        )
      );
      expect(result).toEqual(mockTransactions);
    });

    it('calls transactions/me without query string when no parameters are provided', async () => {
      const mockTransactions = [];
      protectedApi.get.mockResolvedValue({ data: mockTransactions });

      const result = await TransactionService.getAll();

      expect(protectedApi.get).toHaveBeenCalledWith('transactions/me');
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('create', () => {
    it('creates a transaction with mapped event_id', async () => {
      const mockCreated = { id: 'tx-new', name: 'Jantar' };
      protectedApi.post.mockResolvedValue({ data: mockCreated });

      const result = await TransactionService.create({
        name: 'Jantar',
        amount: 150,
        date: '2026-03-01',
        type: 'EXPENSE',
        eventId: 'event-123',
      });

      expect(protectedApi.post).toHaveBeenCalledWith('/transactions/me', {
        name: 'Jantar',
        amount: 150,
        date: '2026-03-01',
        type: 'EXPENSE',
        event_id: 'event-123',
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('updates a transaction by id with mapped event_id', async () => {
      const mockUpdated = { id: 'tx-1', name: 'Jantar Atualizado' };
      protectedApi.patch.mockResolvedValue({ data: mockUpdated });

      const result = await TransactionService.update({
        id: 'tx-1',
        name: 'Jantar Atualizado',
        amount: 180,
        date: '2026-03-01',
        type: 'EXPENSE',
        eventId: 'event-123',
      });

      expect(protectedApi.patch).toHaveBeenCalledWith('transactions/me/tx-1', {
        name: 'Jantar Atualizado',
        amount: 180,
        date: '2026-03-01',
        type: 'EXPENSE',
        event_id: 'event-123',
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('deletes a transaction by id', async () => {
      protectedApi.delete.mockResolvedValue({ data: { success: true } });

      const result = await TransactionService.delete({ id: 'tx-1' });

      expect(protectedApi.delete).toHaveBeenCalledWith('transactions/me/tx-1');
      expect(result).toEqual({ success: true });
    });
  });
});

describe('BalanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches balance with date range query params', async () => {
    const mockBalance = { balance: 500 };
    protectedApi.get.mockResolvedValue({ data: mockBalance });

    const result = await BalanceService.getBalance({
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(protectedApi.get).toHaveBeenCalledWith(
      '/users/me/balance?from=2026-01-01&to=2026-01-31'
    );
    expect(result).toEqual(mockBalance);
  });
});
