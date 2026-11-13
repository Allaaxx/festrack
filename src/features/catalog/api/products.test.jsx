import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  getCatalogMetricsQueryKey,
  getStockMovementsQueryKey,
} from '@/features/catalog';
import {
  adjustStockMutationKey,
  createProductMutationKey,
  deleteProductMutationKey,
  getProductsQueryKey,
  ProductService,
  updateProductMutationKey,
  useAdjustStock,
  useCreateProduct,
  useDeleteProduct,
  useGetProducts,
  useUpdateProduct,
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
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  protectedApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
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
    useShopContext.mockReturnValue({
      activeShop: mockShop,
      currentShop: mockShop,
    });
  });

  describe('ProductService', () => {
    it('returns empty array when shopId is not provided', async () => {
      const result = await ProductService.getAll();
      expect(result).toEqual([]);
      expect(protectedApi.get).not.toHaveBeenCalled();
    });

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

    it('returns empty array when API returns empty list instead of fallback fixtures', async () => {
      protectedApi.get.mockResolvedValueOnce({ data: [] });

      const result = await ProductService.getAll({ shopId: 'shop-1' });

      expect(result).toEqual([]);
    });

    it('propagates API errors instead of falling back to static fixtures', async () => {
      protectedApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        ProductService.getAll({ shopId: 'shop-1' })
      ).rejects.toThrow('Network error');
    });

    describe('getById', () => {
      it('fetches single product by shopId and id from live API', async () => {
        const mockProduct = { id: 'prod-1', name: 'Mesa Provençal' };
        protectedApi.get.mockResolvedValueOnce({ data: mockProduct });

        const result = await ProductService.getById({
          shopId: 'shop-1',
          id: 'prod-1',
        });

        expect(protectedApi.get).toHaveBeenCalledWith(
          '/shops/shop-1/products/prod-1'
        );
        expect(result).toEqual(mockProduct);
      });
    });

    describe('create', () => {
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

      it('propagates errors when backend fails instead of creating fake fixture entity', async () => {
        protectedApi.post.mockRejectedValueOnce(new Error('Server error'));

        await expect(
          ProductService.create({
            shopId: 'shop-1',
            name: 'Toalha de Mesa Branca',
            type: 'sale',
            price: 35,
            quantity: 20,
          })
        ).rejects.toThrow('Server error');
      });
    });

    describe('update', () => {
      it('calls protectedApi.patch with shopId, id, and updated payload including bundle_items', async () => {
        const updatedBundle = {
          id: 'bundle-1',
          shop_id: 'shop-1',
          name: 'Pacote Provençal Atualizado',
          slug: 'pacote-provencal-atualizado',
          type: 'rent',
          price: 420,
          is_bundle: true,
          bundle_items: [{ product_id: 'prod-1', quantity: 2 }],
        };
        protectedApi.patch.mockResolvedValueOnce({ data: updatedBundle });

        const result = await ProductService.update({
          shopId: 'shop-1',
          id: 'bundle-1',
          name: 'Pacote Provençal Atualizado',
          type: 'rent',
          price: 420,
          is_bundle: true,
          bundle_items: [{ product_id: 'prod-1', quantity: 2 }],
        });

        expect(protectedApi.patch).toHaveBeenCalledWith(
          '/shops/shop-1/products/bundle-1',
          expect.objectContaining({
            name: 'Pacote Provençal Atualizado',
            slug: 'pacote-provencal-atualizado',
            type: 'rent',
            price: 420,
            is_bundle: true,
            bundle_items: [{ product_id: 'prod-1', quantity: 2 }],
          })
        );
        expect(result).toEqual(updatedBundle);
      });
    });

    describe('delete', () => {
      it('calls protectedApi.delete with shopId and product id', async () => {
        const deletedProduct = { id: 'prod-1', name: 'Mesa' };
        protectedApi.delete.mockResolvedValueOnce({ data: deletedProduct });

        const result = await ProductService.delete({
          shopId: 'shop-1',
          id: 'prod-1',
        });

        expect(protectedApi.delete).toHaveBeenCalledWith(
          '/shops/shop-1/products/prod-1'
        );
        expect(result).toEqual(deletedProduct);
      });
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

      it('propagates API error instead of mutating local fixtures', async () => {
        protectedApi.post.mockRejectedValueOnce(new Error('Network error'));

        await expect(
          ProductService.adjustStock({
            shopId: 'shop-1',
            productId: 'prod-1',
            delta: 3,
            type: 'INBOUND',
            reason: 'Ajuste manual de teste',
          })
        ).rejects.toThrow('Network error');
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
      expect(getProductsQueryKey({ shopId: 'shop-1', type: 'bundle' })).toEqual(
        ['getProducts', 'shop-1', { type: 'bundle' }]
      );
    });
  });

  describe('useCreateProduct', () => {
    it('provides predictable mutation key', () => {
      expect(createProductMutationKey).toEqual(['createProduct']);
    });

    it('executes mutation, invalidates products and catalogMetrics queries, and shows toast', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
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

  describe('useUpdateProduct', () => {
    it('provides predictable mutation key', () => {
      expect(updateProductMutationKey).toEqual(['updateProduct']);
    });

    it('executes PATCH mutation, invalidates queries, and shows success toast', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const updatedProduct = {
        id: 'prod-1',
        name: 'Mesa Provençal Editada',
        type: 'rent',
        price: 150,
      };
      protectedApi.patch.mockResolvedValueOnce({ data: updatedProduct });

      const onSuccessCallback = vi.fn();
      const { result } = renderHook(
        () => useUpdateProduct({ onSuccess: onSuccessCallback }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutateAsync({
          id: 'prod-1',
          name: 'Mesa Provençal Editada',
          type: 'rent',
          price: 150,
        });
      });

      expect(protectedApi.patch).toHaveBeenCalledWith(
        '/shops/shop-1/products/prod-1',
        expect.objectContaining({
          name: 'Mesa Provençal Editada',
          price: 150,
        })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['getProducts'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['catalogMetrics'] })
      );
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: expect.stringMatching(/produto atualizado com sucesso/i),
        })
      );
      expect(onSuccessCallback).toHaveBeenCalledWith(
        updatedProduct,
        expect.anything(),
        undefined
      );
    });
  });

  describe('useDeleteProduct', () => {
    it('provides predictable mutation key', () => {
      expect(deleteProductMutationKey).toEqual(['deleteProduct']);
    });

    it('executes DELETE mutation, invalidates queries, and shows success toast', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      protectedApi.delete.mockResolvedValueOnce({ data: { id: 'prod-1' } });

      const { result } = renderHook(() => useDeleteProduct(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ id: 'prod-1' });
      });

      expect(protectedApi.delete).toHaveBeenCalledWith(
        '/shops/shop-1/products/prod-1'
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['getProducts'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['catalogMetrics'] })
      );
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: expect.stringMatching(/produto excluído com sucesso/i),
        })
      );
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
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
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

      expect(capturedQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: getProductsQueryKey({ shopId: 'shop-1', userId: 'usr-1' }),
      });
      expect(capturedQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: getCatalogMetricsQueryKey({
          shopId: 'shop-1',
          userId: 'usr-1',
        }),
      });
      expect(capturedQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: getStockMovementsQueryKey({
          shopId: 'shop-1',
          userId: 'usr-1',
        }),
      });

      expect(toast.add).toHaveBeenCalledWith({
        type: 'success',
        description: 'Estoque ajustado com sucesso!',
      });
    });
  });
});
