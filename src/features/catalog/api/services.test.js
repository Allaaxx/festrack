import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CatalogService,
  EMPTY_CATALOG_METRICS,
  EMPTY_STOCK_MOVEMENTS,
} from '@/features/catalog/api/services';
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
        activeCatalog: {
          total: 50,
          simpleProducts: 38,
          bundles: 12,
          trend: 15,
        },
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

    it('returns empty metrics instead of fixtures when the API returns an error', async () => {
      protectedApi.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await CatalogService.getMetrics({ shopId });

      expect(result).toEqual(EMPTY_CATALOG_METRICS);
    });

    it('computes real metrics from shop products when metrics endpoint returns 404', async () => {
      protectedApi.get
        .mockRejectedValueOnce({ response: { status: 404 } })
        .mockResolvedValueOnce({
          data: [
            {
              id: 'p-1',
              name: 'Mesa',
              type: 'rent',
              is_bundle: false,
              stock: { quantity: 10, reserved: 4 },
            },
            {
              id: 'p-2',
              name: 'Kit',
              type: 'rent',
              is_bundle: true,
              available_stock: 0,
            },
          ],
        });

      const result = await CatalogService.getMetrics({ shopId });

      expect(result.activeCatalog.total).toBe(2);
      expect(result.activeCatalog.simpleProducts).toBe(1);
      expect(result.activeCatalog.bundles).toBe(1);
      expect(result.activeRentals.total).toBe(4);
      expect(result.stockAlerts.total).toBe(1);
    });

    it('returns empty metrics when shopId is not provided', async () => {
      const result = await CatalogService.getMetrics();
      expect(result).toEqual(EMPTY_CATALOG_METRICS);
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

    it('returns empty movements and series when shopId is not provided', async () => {
      const result = await CatalogService.getStockMovements();
      expect(result).toEqual(EMPTY_STOCK_MOVEMENTS);
      expect(protectedApi.get).not.toHaveBeenCalled();
    });

    it('returns empty movements and series instead of fixtures when the API fails', async () => {
      protectedApi.get.mockRejectedValueOnce(new Error('Backend offline'));

      const result = await CatalogService.getStockMovements({ shopId });

      expect(result).toEqual(EMPTY_STOCK_MOVEMENTS);
    });
  });
});
