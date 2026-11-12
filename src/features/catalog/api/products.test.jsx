import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  DEFAULT_PRODUCT_FIXTURES,
  getProductsQueryKey,
  ProductService,
  useGetProducts,
} from '@/features/catalog/api/products';
import protectedApi from '@/lib/axios';

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
