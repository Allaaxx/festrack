import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  DEFAULT_STOCK_MOVEMENTS,
  getCatalogMetricsQueryKey,
  getStockMovementsQueryKey,
} from '@/features/catalog';
import {
  adjustStockMutationKey,
  DEFAULT_PRODUCT_FIXTURES,
  getProductsQueryKey,
  ProductService,
  useAdjustStock,
  useGetProducts,
} from '@/features/catalog/api/products';
import protectedApi from '@/lib/axios';

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
  UNPROVIDED_SHOP_CONTEXT: Symbol('UNPROVIDED_SHOP_CONTEXT'),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  protectedApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Catalog Products API & Hooks', () => {
  const mockUser = { id: 'usr-1', name: 'Ana', email: 'ana@festrack.com' };
  const mockShop = { id: 'shop-1', name: 'Loja Festas' };

  const createWrapper = () => {
    const queryClient = new QueryClient({
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

    useAuthContext.mockReturnValue({ user: mockUser });
    useShopContext.mockReturnValue({ activeShop: mockShop, currentShop: mockShop });
  });

  describe('DEFAULT_PRODUCT_FIXTURES', () => {
    it('contains simple products of type sale, rent, and service', () => {
      const types = DEFAULT_PRODUCT_FIXTURES.map((p) => p.type);
      expect(types).toContain('rent');
      expect(types).toContain('sale');
      expect(types).toContain('service');

      const saleProduct = DEFAULT_PRODUCT_FIXTURES.find(
        (p) => p.type === 'sale' && !p.is_bundle
      );
      expect(saleProduct).toBeDefined();
      expect(saleProduct.stock).toBeDefined();
      expect(saleProduct.stock.quantity).toBeGreaterThan(0);

      const rentProduct = DEFAULT_PRODUCT_FIXTURES.find(
        (p) => p.type === 'rent' && !p.is_bundle
      );
      expect(rentProduct).toBeDefined();
      expect(rentProduct.stock).toBeDefined();

      const serviceProduct = DEFAULT_PRODUCT_FIXTURES.find(
        (p) => p.type === 'service'
      );
      expect(serviceProduct).toBeDefined();
      expect(serviceProduct.stock).toBeNull();
    });

    it('contains virtual product bundles with components and multipliers', () => {
      const bundle = DEFAULT_PRODUCT_FIXTURES.find((p) => p.is_bundle);
      expect(bundle).toBeDefined();
      expect(bundle.bundle_items.length).toBeGreaterThan(0);
      expect(bundle.bundle_items[0].quantity).toBeGreaterThan(0);
      expect(bundle.bundle_items[0].product_id).toBeDefined();
    });
  });

  describe('ProductService', () => {
    it('calls protectedApi.get with shopId and type filter', async () => {
      const mockResponse = [{ id: 'p-1', name: 'Produto 1', type: 'rent' }];
      protectedApi.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await ProductService.getAll({
        shopId: 'shop-1',
        type: 'rent',
      });

      expect(protectedApi.get).toHaveBeenCalledWith(
        '/shops/shop-1/products?type=rent'
      );
      expect(result).toEqual(mockResponse);
    });

    it('falls back gracefully to fixtures when backend returns empty or errors', async () => {
      protectedApi.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await ProductService.getAll({ shopId: 'shop-1' });

      expect(result).toEqual(DEFAULT_PRODUCT_FIXTURES);
    });

    it('filters fallback fixtures when type is passed and backend fails', async () => {
      protectedApi.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await ProductService.getAll({
        shopId: 'shop-1',
        type: 'service',
      });

      expect(result.every((p) => p.type === 'service')).toBe(true);
    });

    describe('adjustStock', () => {
      it('calls protectedApi.post with stock adjust endpoint and payload', async () => {
        const mockResponse = {
          stock: { quantity: 20, reserved: 3 },
          movement: { id: 'mov-test', type: 'INBOUND', quantity: 5 },
        };
        protectedApi.post.mockResolvedValueOnce({ data: mockResponse });

        const result = await ProductService.adjustStock({
          shopId: 'shop-1',
          productId: 'prod-1',
          delta: 5,
          type: 'INBOUND',
          reason: 'Lote de compra adicional',
        });

        expect(protectedApi.post).toHaveBeenCalledWith(
          '/shops/shop-1/products/prod-1/stock/adjust',
          {
            quantityDelta: 5,
            type: 'INBOUND',
            notes: 'Lote de compra adicional',
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('falls back to local fixtures on API error, updates stock and registers movement', async () => {
        protectedApi.post.mockRejectedValueOnce(new Error('Network error'));

        const targetProduct = DEFAULT_PRODUCT_FIXTURES.find(
          (p) => p.id === 'prod-1'
        );
        const initialQuantity = targetProduct.stock.quantity;
        const initialMovementsCount = DEFAULT_STOCK_MOVEMENTS.length;

        const result = await ProductService.adjustStock({
          shopId: 'shop-1',
          productId: 'prod-1',
          delta: 3,
          type: 'INBOUND',
          reason: 'Ajuste manual de teste',
        });

        expect(targetProduct.stock.quantity).toBe(initialQuantity + 3);
        expect(DEFAULT_STOCK_MOVEMENTS.length).toBe(initialMovementsCount + 1);
        expect(DEFAULT_STOCK_MOVEMENTS[0]).toMatchObject({
          type: 'INBOUND',
          quantity: 3,
          note: 'Ajuste manual de teste',
        });
        expect(result.stock.quantity).toBe(initialQuantity + 3);
      });

      it('handles LOSS movements by decreasing stock in fixtures', async () => {
        protectedApi.post.mockRejectedValueOnce(new Error('Network error'));

        const targetProduct = DEFAULT_PRODUCT_FIXTURES.find(
          (p) => p.id === 'prod-2'
        );
        const initialQuantity = targetProduct.stock.quantity;

        await ProductService.adjustStock({
          shopId: 'shop-1',
          productId: 'prod-2',
          delta: 2,
          type: 'LOSS',
          reason: 'Quebra durante manuseio',
        });

        expect(targetProduct.stock.quantity).toBe(initialQuantity - 2);
        expect(DEFAULT_STOCK_MOVEMENTS[0]).toMatchObject({
          type: 'LOSS',
          quantity: 2,
          note: 'Quebra durante manuseio',
        });
      });
    });
  });

  describe('useAdjustStock', () => {
    it('provides predictable mutation key', () => {
      expect(adjustStockMutationKey).toEqual(['adjustStock']);
    });

    it('executes mutation, invalidates queries and displays success toast', async () => {
      const mockResult = {
        stock: { quantity: 18, reserved: 3 },
        movement: { id: 'mov-1', type: 'ADJUSTMENT', quantity: 3 },
      };
      protectedApi.post.mockResolvedValueOnce({ data: mockResult });

      let capturedQueryClient;
      const customWrapper = () => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        });
        capturedQueryClient = queryClient;
        vi.spyOn(queryClient, 'invalidateQueries');

        return ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
      };

      const { result } = renderHook(() => useAdjustStock(), {
        wrapper: customWrapper(),
      });

      await result.current.mutateAsync({
        productId: 'prod-1',
        delta: 3,
        type: 'ADJUSTMENT',
        reason: 'Inventário conferido com sucesso',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify query invalidations
      expect(capturedQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: getProductsQueryKey({ shopId: 'shop-1', userId: 'usr-1' }),
      });
      expect(capturedQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: getCatalogMetricsQueryKey({ shopId: 'shop-1', userId: 'usr-1' }),
      });
      expect(capturedQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: getStockMovementsQueryKey({ shopId: 'shop-1', userId: 'usr-1' }),
      });

      // Verify success toast confirmation
      expect(toast.add).toHaveBeenCalledWith({
        type: 'success',
        description: 'Estoque ajustado com sucesso!',
      });
    });
  });

  describe('useGetProducts', () => {
    it('fetches products using TanStack Query', async () => {
      const mockData = [{ id: 'prod-test', name: 'Item Teste', type: 'sale' }];
      protectedApi.get.mockResolvedValueOnce({ data: mockData });

      const { result } = renderHook(() => useGetProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
    });

    it('generates predictable query keys', () => {
      expect(getProductsQueryKey({ shopId: 'shop-1' })).toEqual([
        'getProducts',
        'shop-1',
      ]);
      expect(
        getProductsQueryKey({ shopId: 'shop-1', type: 'bundle' })
      ).toEqual(['getProducts', 'shop-1', { type: 'bundle' }]);
    });
  });
});
