import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  getCatalogMetricsQueryKey,
  getStockMovementsQueryKey,
} from '@/features/catalog/api/hooks';
import protectedApi from '@/lib/axios';

const buildProductSlug = (name, existingSlug) => {
  if (existingSlug) return existingSlug;
  if (!name) return undefined;
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'produto'
  );
};

export const ProductService = {
  /**
   * Retrieves products for the active shop from the live API.
   *
   * @param {Object} [input]
   * @param {string} [input.shopId]
   * @param {string} [input.type]
   * @returns {Promise<Array<Object>>}
   */
  getAll: async ({ shopId, type } = {}) => {
    if (!shopId) {
      return [];
    }

    const hasTypeFilter =
      Boolean(type) && type !== 'all' && type !== 'todos';
    const endpoint = hasTypeFilter
      ? `/shops/${shopId}/products?type=${type}`
      : `/shops/${shopId}/products`;

    const response = await protectedApi.get(endpoint);
    return Array.isArray(response?.data) ? response.data : [];
  },

  /**
   * Retrieves a single product by ID from the live API.
   *
   * @param {Object} input
   * @param {string} input.shopId
   * @param {string} input.id
   * @returns {Promise<Object|null>}
   */
  getById: async ({ shopId, id } = {}) => {
    const response = await protectedApi.get(`/shops/${shopId}/products/${id}`);
    return response?.data ?? null;
  },

  /**
   * Creates a new simple product or bundle (Pacote) in the active shop.
   *
   * @param {Object} input
   * @param {string} input.shopId
   * @param {string} input.name
   * @param {string} [input.slug]
   * @param {string} input.type - 'sale' | 'rent' | 'service'
   * @param {number} input.price
   * @param {string} [input.description]
   * @param {boolean} [input.is_bundle]
   * @param {number} [input.quantity]
   * @param {number} [input.initial_quantity]
   * @param {Array<Object>} [input.bundle_items]
   * @returns {Promise<Object>}
   */
  create: async ({ shopId, ...data } = {}) => {
    const slug = buildProductSlug(data.name, data.slug) || 'produto';
    const payload = {
      ...data,
      slug,
    };

    const response = await protectedApi.post(
      `/shops/${shopId}/products`,
      payload
    );
    return response?.data;
  },

  /**
   * Updates an existing simple product or bundle (Pacote) in the active shop.
   *
   * @param {Object} input
   * @param {string} input.shopId
   * @param {string} input.id
   * @param {string} [input.name]
   * @param {string} [input.slug]
   * @param {string} [input.type]
   * @param {number} [input.price]
   * @param {string} [input.description]
   * @param {boolean} [input.is_bundle]
   * @param {number} [input.quantity]
   * @param {Array<Object>} [input.bundle_items]
   * @returns {Promise<Object>}
   */
  update: async ({ shopId, id, productId, ...data } = {}) => {
    const targetId = id ?? productId;
    const slug = buildProductSlug(data.name, data.slug);
    const payload = slug ? { ...data, slug } : { ...data };

    const response = await protectedApi.patch(
      `/shops/${shopId}/products/${targetId}`,
      payload
    );
    return response?.data;
  },

  /**
   * Deletes a product or bundle from the active shop.
   *
   * @param {{ shopId?: string, id?: string, productId?: string } | string} input
   * @returns {Promise<Object>}
   */
  delete: async (input = {}) => {
    const targetId =
      typeof input === 'string' ? input : (input?.id ?? input?.productId);
    const shopId = typeof input === 'object' ? input?.shopId : undefined;

    const response = await protectedApi.delete(
      `/shops/${shopId}/products/${targetId}`
    );
    return response?.data;
  },

  /**
   * Records a manual stock adjustment or audited movement for a product.
   *
   * @param {Object} input
   * @param {string} input.shopId
   * @param {string} input.productId
   * @param {number} input.delta
   * @param {'INBOUND'|'LOSS'|'ADJUSTMENT'} input.type
   * @param {string} input.reason
   * @returns {Promise<Object>}
   */
  adjustStock: async ({ shopId, productId, delta, type, reason }) => {
    const response = await protectedApi.post(
      `/shops/${shopId}/products/${productId}/stock/adjust`,
      {
        quantityDelta: Number(delta),
        type,
        notes: reason,
      }
    );
    return response?.data;
  },
};

/**
 * Constructs TanStack Query cache key for products query.
 */
export const getProductsQueryKey = ({ shopId, userId, type } = {}) => {
  const baseKey = ['getProducts', shopId ?? userId ?? 'all'];
  if (type) {
    return [...baseKey, { type }];
  }
  return baseKey;
};

/**
 * TanStack Query hook to retrieve products for the active shop.
 *
 * @param {Object} [options]
 * @param {string} [options.type]
 * @param {Array<Object>} [options.initialData]
 */
export const useGetProducts = ({ type, initialData, enabled = true } = {}) => {
  const { user } = useAuthContext() || {};
  const { activeShop, currentShop } = useShopContext() || {};
  const shopId = activeShop?.id || currentShop?.id;

  return useQuery({
    queryKey: getProductsQueryKey({ shopId, userId: user?.id, type }),
    queryFn: () => ProductService.getAll({ shopId, type }),
    enabled: enabled && (Boolean(shopId) || Boolean(user?.id)),
    initialData,
  });
};

export const createProductMutationKey = ['createProduct'];

/**
 * TanStack Query mutation hook to create a product or bundle (Pacote).
 * Updates query cache for products and catalog metrics, and triggers toast confirmation.
 *
 * @param {Object} [options]
 */
export const useCreateProduct = (options = {}) => {
  const queryClient = useQueryClient();
  const { activeShop, currentShop } = useShopContext() || {};
  const shopId = activeShop?.id || currentShop?.id;

  const { onSuccess, onError, ...restOptions } = options;

  return useMutation({
    mutationKey: createProductMutationKey,
    mutationFn: (data) =>
      ProductService.create({
        shopId: data?.shopId ?? shopId,
        ...data,
      }),
    onSuccess: async (createdProduct, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['getProducts'] }),
        queryClient.invalidateQueries({ queryKey: ['catalogMetrics'] }),
      ]);

      toast.add({
        type: 'success',
        title: 'Produto criado com sucesso!',
        description: 'Produto criado com sucesso!',
      });

      onSuccess?.(createdProduct, variables, context);
    },
    onError: (error, variables, context) => {
      toast.add({
        type: 'error',
        title: 'Erro ao criar produto',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Não foi possível criar o produto.',
      });

      onError?.(error, variables, context);
    },
    ...restOptions,
  });
};

export const updateProductMutationKey = ['updateProduct'];

/**
 * TanStack Query mutation hook to update an existing product or bundle (Pacote).
 *
 * @param {Object} [options]
 */
export const useUpdateProduct = (options = {}) => {
  const queryClient = useQueryClient();
  const { activeShop, currentShop } = useShopContext() || {};
  const shopId = activeShop?.id || currentShop?.id;

  const { onSuccess, onError, ...restOptions } = options;

  return useMutation({
    mutationKey: updateProductMutationKey,
    mutationFn: (data) =>
      ProductService.update({
        shopId: data?.shopId ?? shopId,
        ...data,
      }),
    onSuccess: async (updatedProduct, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['getProducts'] }),
        queryClient.invalidateQueries({ queryKey: ['catalogMetrics'] }),
        queryClient.invalidateQueries({ queryKey: ['stockMovements'] }),
      ]);

      toast.add({
        type: 'success',
        title: 'Produto atualizado com sucesso!',
        description: 'Produto atualizado com sucesso!',
      });

      onSuccess?.(updatedProduct, variables, context);
    },
    onError: (error, variables, context) => {
      toast.add({
        type: 'error',
        title: 'Erro ao atualizar produto',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Não foi possível atualizar o produto.',
      });

      onError?.(error, variables, context);
    },
    ...restOptions,
  });
};

export const deleteProductMutationKey = ['deleteProduct'];

/**
 * TanStack Query mutation hook to delete a product or bundle (Pacote).
 *
 * @param {Object} [options]
 */
export const useDeleteProduct = (options = {}) => {
  const queryClient = useQueryClient();
  const { activeShop, currentShop } = useShopContext() || {};
  const shopId = activeShop?.id || currentShop?.id;

  const { onSuccess, onError, ...restOptions } = options;

  return useMutation({
    mutationKey: deleteProductMutationKey,
    mutationFn: (input) => {
      const payload =
        typeof input === 'string'
          ? { id: input, shopId }
          : { ...input, shopId: input?.shopId ?? shopId };
      return ProductService.delete(payload);
    },
    onSuccess: async (deletedProduct, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['getProducts'] }),
        queryClient.invalidateQueries({ queryKey: ['catalogMetrics'] }),
        queryClient.invalidateQueries({ queryKey: ['stockMovements'] }),
      ]);

      toast.add({
        type: 'success',
        title: 'Produto excluído com sucesso!',
        description: 'Produto excluído com sucesso!',
      });

      onSuccess?.(deletedProduct, variables, context);
    },
    onError: (error, variables, context) => {
      toast.add({
        type: 'error',
        title: 'Erro ao excluir produto',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Não foi possível excluir o produto.',
      });

      onError?.(error, variables, context);
    },
    ...restOptions,
  });
};

export const adjustStockMutationKey = ['adjustStock'];

/**
 * TanStack Query mutation hook to record manual stock adjustments.
 * Invalidates products, metrics, and stock movements queries upon success,
 * and surfaces a toast confirmation.
 *
 * @param {Object} [options]
 */
export const useAdjustStock = (options = {}) => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext() || {};
  const { activeShop, currentShop } = useShopContext() || {};
  const shopId = activeShop?.id || currentShop?.id;

  return useMutation({
    mutationKey: adjustStockMutationKey,
    mutationFn: (input) =>
      ProductService.adjustStock({
        shopId: input?.shopId ?? shopId,
        productId: input?.productId,
        delta: input?.delta,
        type: input?.type,
        reason: input?.reason ?? input?.notes,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: getProductsQueryKey({ shopId, userId: user?.id }),
      });
      queryClient.invalidateQueries({
        queryKey: getCatalogMetricsQueryKey({ shopId, userId: user?.id }),
      });
      queryClient.invalidateQueries({
        queryKey: getStockMovementsQueryKey({ shopId, userId: user?.id }),
      });

      toast.add({
        type: 'success',
        description: 'Estoque ajustado com sucesso!',
      });

      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
