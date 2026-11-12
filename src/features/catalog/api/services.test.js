import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_CATALOG_METRICS,
  DEFAULT_STOCK_MOVEMENTS,
  DEFAULT_STOCK_MOVEMENTS_SERIES,
} from '@/features/catalog/api/fixtures';
import { CatalogService } from '@/features/catalog/api/services';
import protectedApi from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('CatalogService', () => {
  const shopId = 'shop-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('fetches catalog metrics from the API when available', async () => {
      const mockMetrics = {
        activeCatalog: { total: 50, trend: 15 },
        activeRentals: { total: 30, trend: 10 },
        stockAlerts: { total: 1, trend: -50 },
      };

      protectedApi.get.mockResolvedValueOnce({ data: mockMetrics });

      const result = await CatalogService.getMetrics({ shopId });

      expect(protectedApi.get).toHaveBeenCalledWith(
        `/shops/${shopId}/catalog/metrics`
      );
      expect(result).toEqual(mockMetrics);
    });

    it('falls back to domain fixture data when the API returns an error', async () => {
      protectedApi.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await CatalogService.getMetrics({ shopId });

      expect(result).toEqual(DEFAULT_CATALOG_METRICS);
    });

    it('returns fixture data when shopId is not provided', async () => {
      const result = await CatalogService.getMetrics();
      expect(result).toEqual(DEFAULT_CATALOG_METRICS);
      expect(protectedApi.get).not.toHaveBeenCalled();
    });
  });

  describe('getStockMovements', () => {
    it('fetches stock movements from the API with query params', async () => {
      const mockData = {
        movements: [{ id: 'mov-1', type: 'INBOUND', quantity: 10 }],
        series: [{ date: '2026-11-12', inbound: 10 }],
      };

      protectedApi.get.mockResolvedValueOnce({ data: mockData });

      const result = await CatalogService.getStockMovements({
        shopId,
        from: '2026-11-01',
        to: '2026-11-12',
      });

      expect(protectedApi.get).toHaveBeenCalledWith(
        `/shops/${shopId}/stock/movements`,
        {
          params: {
            from: '2026-11-01',
            to: '2026-11-12',
          },
        }
      );
      expect(result).toEqual(mockData);
    });

    it('falls back to domain stock movements fixture data when the API fails', async () => {
      protectedApi.get.mockRejectedValueOnce(new Error('Backend offline'));

      const result = await CatalogService.getStockMovements({ shopId });

      expect(result).toEqual({
        movements: DEFAULT_STOCK_MOVEMENTS,
        series: DEFAULT_STOCK_MOVEMENTS_SERIES,
      });
    });
  });
});
