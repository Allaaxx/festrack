import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  getCatalogMetricsQueryKey,
  getStockMovementsQueryKey,
  useGetCatalogMetrics,
  useGetStockMovements,
} from '@/features/catalog/api/hooks';
import { CatalogService } from '@/features/catalog/api/services';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
}));

vi.mock('@/features/catalog/api/services', () => ({
  CatalogService: {
    getMetrics: vi.fn(),
    getStockMovements: vi.fn(),
  },
}));

describe('Catalog API Hooks', () => {
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
    useShopContext.mockReturnValue({
      activeShop: { id: 'shop-1', name: 'Festas Encantadas', role: 'OWNER' },
    });
  });

  describe('useGetCatalogMetrics', () => {
    it('remains disabled when user is null', () => {
      useAuthContext.mockReturnValue({ user: null });

      const { result } = renderHook(() => useGetCatalogMetrics(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(CatalogService.getMetrics).not.toHaveBeenCalled();
    });

    it('remains disabled when activeShop is null', () => {
      useAuthContext.mockReturnValue({ user: { id: 'user-1' } });
      useShopContext.mockReturnValue({ activeShop: null });

      const { result } = renderHook(() => useGetCatalogMetrics(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(CatalogService.getMetrics).not.toHaveBeenCalled();
    });

    it('fetches catalog metrics when user and activeShop are present', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'user-1' } });
      const mockMetrics = {
        activeCatalog: { total: 48, trend: 12 },
        activeRentals: { total: 26, trend: 8 },
        stockAlerts: { total: 3, trend: -25 },
      };
      CatalogService.getMetrics.mockResolvedValue(mockMetrics);

      const { result } = renderHook(() => useGetCatalogMetrics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(CatalogService.getMetrics).toHaveBeenCalledWith({
        shopId: 'shop-1',
      });
      expect(result.current.data).toEqual(mockMetrics);
    });

    it('generates consistent query key', () => {
      expect(
        getCatalogMetricsQueryKey({ userId: 'u1', shopId: 's1' })
      ).toEqual(['catalogMetrics', 'u1', 's1']);
    });
  });

  describe('useGetStockMovements', () => {
    it('remains disabled when activeShop is null', () => {
      useAuthContext.mockReturnValue({ user: { id: 'user-1' } });
      useShopContext.mockReturnValue({ activeShop: null });

      const { result } = renderHook(() => useGetStockMovements(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(CatalogService.getStockMovements).not.toHaveBeenCalled();
    });

    it('fetches stock movements with date filter parameters', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'user-1' } });
      const mockMovements = {
        movements: [],
        series: [{ day: 'Seg', inbound: 20 }],
      };
      CatalogService.getStockMovements.mockResolvedValue(mockMovements);

      const { result } = renderHook(
        () =>
          useGetStockMovements({
            from: '2026-11-01',
            to: '2026-11-07',
            period: '7d',
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(CatalogService.getStockMovements).toHaveBeenCalledWith({
        shopId: 'shop-1',
        from: '2026-11-01',
        to: '2026-11-07',
        period: '7d',
      });
      expect(result.current.data).toEqual(mockMovements);
    });

    it('generates consistent query key with filters', () => {
      expect(
        getStockMovementsQueryKey({
          userId: 'u1',
          shopId: 's1',
          from: '2026-11-01',
          to: '2026-11-07',
          period: '7d',
        })
      ).toEqual([
        'stockMovements',
        'u1',
        's1',
        { from: '2026-11-01', to: '2026-11-07', period: '7d' },
      ]);
    });
  });
});
