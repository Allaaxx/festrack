import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  DEFAULT_PRODUCT_FIXTURES,
  getProductsQueryKey,
  ProductService,
  useCreateProduct,
  useGetProducts,
} from '@/features/catalog/api/products';
import protectedApi from '@/lib/axios';

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
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

  describe('ProductService.create', () => {
    it('calls protectedApi.post with shopId, payload, and auto-generated slug', async () => {
      const createdProduct = {
        id: 'prod-new-1',
        shop_id: 'shop-1',
        name: 'Mesa Dobrável Branca',
        slug: 'mesa-dobravel-branca',
        type: 'rent',
        price: 80,
      };
      protectedApi.post.mockResolvedValueOnce({ data: createdProduct });

      const result = await ProductService.create({
        shopId: 'shop-1',
        name: 'Mesa Dobrável Branca',
        type: 'rent',
        price: 80,
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-1/products',
        expect.objectContaining({
          name: 'Mesa Dobrável Branca',
          slug: 'mesa-dobravel-branca',
          type: 'rent',
          price: 80,
        })
      );
      expect(result).toEqual(createdProduct);
    });

    it('falls back gracefully when backend is offline or returns error', async () => {
      protectedApi.post.mockRejectedValueOnce({
        response: { status: 404 },
      });

      const result = await ProductService.create({
        shopId: 'shop-1',
        name: 'Toalha de Mesa Branca',
        type: 'sale',
        price: 35,
        quantity: 20,
      });

      expect(result).toMatchObject({
        name: 'Toalha de Mesa Branca',
        type: 'sale',
        price: 35,
        shop_id: 'shop-1',
      });
      expect(result.id).toBeDefined();
      expect(result.stock.quantity).toBe(20);
    });
  });

  describe('useCreateProduct', () => {
    it('executes mutation, invalidates products and catalogMetrics queries, and shows toast', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const createdProduct = {
        id: 'prod-bundle-1',
        name: 'Kit Provençal Luxo',
        type: 'rent',
        is_bundle: true,
      };
      protectedApi.post.mockResolvedValueOnce({ data: createdProduct });

      const onSuccessCallback = vi.fn();
      const { result } = renderHook(
        () => useCreateProduct({ onSuccess: onSuccessCallback }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutateAsync({
          name: 'Kit Provençal Luxo',
          type: 'rent',
          price: 250,
          is_bundle: true,
          bundle_items: [{ product_id: 'prod-1', quantity: 2 }],
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['getProducts'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['catalogMetrics'] })
      );
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: expect.stringMatching(/produto criado com sucesso/i),
        })
      );
      expect(onSuccessCallback).toHaveBeenCalledWith(
        createdProduct,
        expect.anything(),
        undefined
      );
    });
  });
});
