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
    it('sends from and to query parameters to shop-scoped endpoint when provided', async () => {
      const mockTransactions = [{ id: 'tx-1', name: 'Salário' }];
      protectedApi.get.mockResolvedValue({ data: mockTransactions });

      const result = await TransactionService.getAll({
        shopId: 'shop-1',
        from: '2026-01-01',
        to: '2026-01-31',
      });

      expect(protectedApi.get).toHaveBeenCalledWith(
        '/shops/shop-1/transactions?from=2026-01-01&to=2026-01-31'
      );
      expect(result).toEqual(mockTransactions);
    });

    it('sends event_id query parameter to shop-scoped endpoint when eventId is provided', async () => {
      const mockTransactions = [{ id: 'tx-2', name: 'Passagem Aérea' }];
      protectedApi.get.mockResolvedValue({ data: mockTransactions });

      const result = await TransactionService.getAll({
        shopId: 'shop-1',
        eventId: 'event-uuid-123',
      });

      expect(protectedApi.get).toHaveBeenCalledWith(
        '/shops/shop-1/transactions?event_id=event-uuid-123'
      );
      expect(result).toEqual(mockTransactions);
    });

    it('sends event_id, from, and to when all are provided', async () => {
      const mockTransactions = [{ id: 'tx-3', name: 'Hotel' }];
      protectedApi.get.mockResolvedValue({ data: mockTransactions });

      const result = await TransactionService.getAll({
        shopId: 'shop-1',
        from: '2026-02-01',
        to: '2026-02-28',
        eventId: 'event-uuid-456',
      });

      expect(protectedApi.get).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\/shops\/shop-1\/transactions\?(?=.*event_id=event-uuid-456)(?=.*from=2026-02-01)(?=.*to=2026-02-28)/
        )
      );
      expect(result).toEqual(mockTransactions);
    });

    it('calls /shops/:shopId/transactions without query string when no filter parameters are provided', async () => {
      const mockTransactions = [];
      protectedApi.get.mockResolvedValue({ data: mockTransactions });

      const result = await TransactionService.getAll({ shopId: 'shop-1' });

      expect(protectedApi.get).toHaveBeenCalledWith(
        '/shops/shop-1/transactions'
      );
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('create', () => {
    it('creates a transaction under /shops/:shopId/transactions with mapped event_id', async () => {
      const mockCreated = { id: 'tx-new', name: 'Jantar' };
      protectedApi.post.mockResolvedValue({ data: mockCreated });

      const result = await TransactionService.create({
        shopId: 'shop-1',
        name: 'Jantar',
        amount: 150,
        date: '2026-03-01',
        type: 'EXPENSE',
        eventId: 'event-123',
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-1/transactions',
        {
          name: 'Jantar',
          amount: 150,
          date: '2026-03-01',
          type: 'EXPENSE',
          event_id: 'event-123',
        }
      );
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('updates a transaction by shopId and id with mapped event_id', async () => {
      const mockUpdated = { id: 'tx-1', name: 'Jantar Atualizado' };
      protectedApi.patch.mockResolvedValue({ data: mockUpdated });

      const result = await TransactionService.update({
        shopId: 'shop-1',
        id: 'tx-1',
        name: 'Jantar Atualizado',
        amount: 180,
        date: '2026-03-01',
        type: 'EXPENSE',
        eventId: 'event-123',
      });

      expect(protectedApi.patch).toHaveBeenCalledWith(
        '/shops/shop-1/transactions/tx-1',
        {
          name: 'Jantar Atualizado',
          amount: 180,
          date: '2026-03-01',
          type: 'EXPENSE',
          event_id: 'event-123',
        }
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('deletes a transaction by shopId and id', async () => {
      protectedApi.delete.mockResolvedValue({ data: { success: true } });

      const result = await TransactionService.delete({
        shopId: 'shop-1',
        id: 'tx-1',
      });

      expect(protectedApi.delete).toHaveBeenCalledWith(
        '/shops/shop-1/transactions/tx-1'
      );
      expect(result).toEqual({ success: true });
    });
  });
});

describe('BalanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches shop balance with date range query params', async () => {
    const mockBalance = { balance: 500 };
    protectedApi.get.mockResolvedValue({ data: mockBalance });

    const result = await BalanceService.getBalance({
      shopId: 'shop-1',
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(protectedApi.get).toHaveBeenCalledWith(
      '/shops/shop-1/balance?from=2026-01-01&to=2026-01-31'
    );
    expect(result).toEqual(mockBalance);
  });

  it('fetches shop balance with optional eventId parameter', async () => {
    const mockBalance = { balance: 250 };
    protectedApi.get.mockResolvedValue({ data: mockBalance });

    const result = await BalanceService.getBalance({
      shopId: 'shop-1',
      from: '2026-01-01',
      to: '2026-01-31',
      eventId: 'ev-99',
    });

    expect(protectedApi.get).toHaveBeenCalledWith(
      '/shops/shop-1/balance?from=2026-01-01&to=2026-01-31&event_id=ev-99'
    );
    expect(result).toEqual(mockBalance);
  });
});
