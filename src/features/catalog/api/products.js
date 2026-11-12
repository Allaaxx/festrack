import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import { DEFAULT_STOCK_MOVEMENTS } from '@/features/catalog/api/fixtures';
import {
  getCatalogMetricsQueryKey,
  getStockMovementsQueryKey,
} from '@/features/catalog/api/hooks';
import protectedApi from '@/lib/axios';

/**
 * Fixture simple products.
 */
const simpleFixtures = [
  {
    id: 'prod-1',
    shop_id: 'default-shop',
    name: 'Mesa Rústica Retangular 2m',
    slug: 'mesa-rustica-retangular-2m',
    type: 'rent',
    price: 120,
    description:
      'Mesa de madeira maciça estilo rústico para decoração de eventos e banquetes.',
    images: [
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80',
    ],
    is_bundle: false,
    stock: {
      id: 'stk-1',
      product_id: 'prod-1',
      quantity: 15,
      reserved: 3,
      updated_at: new Date().toISOString(),
    },
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'prod-2',
    shop_id: 'default-shop',
    name: 'Bolo Cenográfico Fake 3 Andares',
    slug: 'bolo-cenografico-fake-3-andares',
    type: 'rent',
    price: 85,
    description:
      'Bolo cenográfico trabalhado em biscuit branco com detalhes dourados elegantes.',
    images: [
      'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=400&q=80',
    ],
    is_bundle: false,
    stock: {
      id: 'stk-2',
      product_id: 'prod-2',
      quantity: 8,
      reserved: 2,
      updated_at: new Date().toISOString(),
    },
    created_at: new Date('2026-01-12').toISOString(),
    updated_at: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'prod-3',
    shop_id: 'default-shop',
    name: 'Suporte para Doces Dourado',
    slug: 'suporte-para-doces-dourado',
    type: 'rent',
    price: 25,
    description:
      'Bandeja e suporte de metal com banho dourado para doces finos e bombons.',
    images: [
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=400&q=80',
    ],
    is_bundle: false,
    stock: {
      id: 'stk-3',
      product_id: 'prod-3',
      quantity: 30,
      reserved: 6,
      updated_at: new Date().toISOString(),
    },
    created_at: new Date('2026-01-15').toISOString(),
    updated_at: new Date('2026-01-15').toISOString(),
  },
  {
    id: 'prod-4',
    shop_id: 'default-shop',
    name: 'Arco de Balões Desconstruído Orgânico',
    slug: 'arco-baloes-desconstruido-organico',
    type: 'sale',
    price: 180,
    description:
      'Guirlanda orgânica de balões látex biodegradáveis em tons suaves e metalizados.',
    images: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=400&q=80',
    ],
    is_bundle: false,
    stock: {
      id: 'stk-4',
      product_id: 'prod-4',
      quantity: 10,
      reserved: 4,
      updated_at: new Date().toISOString(),
    },
    created_at: new Date('2026-01-18').toISOString(),
    updated_at: new Date('2026-01-18').toISOString(),
  },
  {
    id: 'prod-5',
    shop_id: 'default-shop',
    name: 'Vela de Aniversário Personalizada',
    slug: 'vela-de-aniversario-personalizada',
    type: 'sale',
    price: 15,
    description:
      'Vela artesanal temática personalizada com idade e cores do evento.',
    images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
    ],
    is_bundle: false,
    stock: {
      id: 'stk-5',
      product_id: 'prod-5',
      quantity: 50,
      reserved: 5,
      updated_at: new Date().toISOString(),
    },
    created_at: new Date('2026-01-20').toISOString(),
    updated_at: new Date('2026-01-20').toISOString(),
  },
  {
    id: 'prod-6',
    shop_id: 'default-shop',
    name: 'Montagem e Desmontagem de Cenário',
    slug: 'montagem-e-desmontagem-cenario',
    type: 'service',
    price: 250,
    description:
      'Serviço técnico especializado para montagem no local, alinhamento e desmontagem pós-evento.',
    images: [],
    is_bundle: false,
    stock: null,
    created_at: new Date('2026-01-22').toISOString(),
    updated_at: new Date('2026-01-22').toISOString(),
  },
];

/**
 * Fixture virtual bundles referencing simple products with component multipliers.
 */
const bundleFixtures = [
  {
    id: 'bundle-1',
    shop_id: 'default-shop',
    name: 'Kit Festa Infantil Provençal Encantada',
    slug: 'kit-festa-infantil-provencal-encantada',
    type: 'rent',
    price: 350,
    description:
      'Kit completo provençal composto por mesa rústica, bolo cenográfico e conjunto de suportes para doces.',
    images: [
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80',
    ],
    is_bundle: true,
    stock: null,
    bundle_items: [
      {
        id: 'bi-1',
        bundle_product_id: 'bundle-1',
        product_id: 'prod-1',
        quantity: 1,
        componentProduct: simpleFixtures[0],
      },
      {
        id: 'bi-2',
        bundle_product_id: 'bundle-1',
        product_id: 'prod-2',
        quantity: 1,
        componentProduct: simpleFixtures[1],
      },
      {
        id: 'bi-3',
        bundle_product_id: 'bundle-1',
        product_id: 'prod-3',
        quantity: 4,
        componentProduct: simpleFixtures[2],
      },
    ],
    created_at: new Date('2026-01-25').toISOString(),
    updated_at: new Date('2026-01-25').toISOString(),
  },
  {
    id: 'bundle-2',
    shop_id: 'default-shop',
    name: 'Combo Luxo Arco Balões + Suportes + Vela',
    slug: 'combo-luxo-arco-baloes-suportes-vela',
    type: 'sale',
    price: 490,
    description:
      'Combo decorativo com arcos orgânicos, suportes de doces e vela artesanal para celebrações completas.',
    images: [
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=400&q=80',
    ],
    is_bundle: true,
    stock: null,
    bundle_items: [
      {
        id: 'bi-4',
        bundle_product_id: 'bundle-2',
        product_id: 'prod-4',
        quantity: 2,
        componentProduct: simpleFixtures[3],
      },
      {
        id: 'bi-5',
        bundle_product_id: 'bundle-2',
        product_id: 'prod-3',
        quantity: 2,
        componentProduct: simpleFixtures[2],
      },
      {
        id: 'bi-6',
        bundle_product_id: 'bundle-2',
        product_id: 'prod-5',
        quantity: 1,
        componentProduct: simpleFixtures[4],
      },
    ],
    created_at: new Date('2026-01-28').toISOString(),
    updated_at: new Date('2026-01-28').toISOString(),
  },
];

/**
 * Canonical product fixtures including simple items and virtual bundles.
 */
export const DEFAULT_PRODUCT_FIXTURES = [...simpleFixtures, ...bundleFixtures];

const filterFixturesByType = (fixtures, type) => {
  if (!type || type === 'all' || type === 'todos') {
    return fixtures;
  }
  if (type === 'bundle' || type === 'pacote' || type === 'bundle_virtual') {
    return fixtures.filter((p) => p.is_bundle);
  }
  return fixtures.filter((p) => p.type === type && !p.is_bundle);
};

const applyLocalStockAdjustment = ({ productId, delta, type, reason }) => {
  const numDelta = Number(delta) || 0;
  const product = DEFAULT_PRODUCT_FIXTURES.find((p) => p.id === productId);

  if (product && product.stock) {
    let newQuantity = product.stock.quantity;
    if (type === 'INBOUND') {
      newQuantity += Math.abs(numDelta);
    } else if (type === 'LOSS') {
      newQuantity = Math.max(0, newQuantity - Math.abs(numDelta));
    } else if (type === 'ADJUSTMENT') {
      newQuantity = Math.max(0, newQuantity + numDelta);
    }

    product.stock = {
      ...product.stock,
      quantity: newQuantity,
      updated_at: new Date().toISOString(),
    };
  }

  const newMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    productId,
    product_id: productId,
    productName: product?.name ?? 'Produto',
    quantity: Math.abs(numDelta),
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    note: reason,
    notes: reason,
  };

  DEFAULT_STOCK_MOVEMENTS.unshift(newMovement);

  return {
    stock: product?.stock,
    movement: newMovement,
    product,
  };
};

export const ProductService = {
  /**
   * Retrieves products for the active shop.
   * Gracefully falls back to demo fixtures if backend is offline or empty.
   *
   * @param {Object} [input]
   * @param {string} [input.shopId]
   * @param {string} [input.type]
   * @returns {Promise<Array<Object>>}
   */
  getAll: async ({ shopId, type } = {}) => {
    try {
      const endpoint = type
        ? `/shops/${shopId}/products?type=${type}`
        : `/shops/${shopId}/products`;

      const response = await protectedApi.get(endpoint);
      if (Array.isArray(response?.data) && response.data.length > 0) {
        return response.data;
      }
      return filterFixturesByType(DEFAULT_PRODUCT_FIXTURES, type);
    } catch {
      return filterFixturesByType(DEFAULT_PRODUCT_FIXTURES, type);
    }
  },

  /**
   * Retrieves a single product by ID.
   *
   * @param {Object} input
   * @param {string} input.shopId
   * @param {string} input.id
   * @returns {Promise<Object>}
   */
  getById: async ({ shopId, id } = {}) => {
    try {
      const response = await protectedApi.get(`/shops/${shopId}/products/${id}`);
      if (response?.data) {
        return response.data;
      }
      return (
        DEFAULT_PRODUCT_FIXTURES.find((p) => p.id === id) ??
        DEFAULT_PRODUCT_FIXTURES[0]
      );
    } catch {
      return (
        DEFAULT_PRODUCT_FIXTURES.find((p) => p.id === id) ??
        DEFAULT_PRODUCT_FIXTURES[0]
      );
    }
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
    const numDelta = Number(delta);
    try {
      const response = await protectedApi.post(
        `/shops/${shopId}/products/${productId}/stock/adjust`,
        {
          quantityDelta: numDelta,
          type,
          notes: reason,
        }
      );
      applyLocalStockAdjustment({ productId, delta: numDelta, type, reason });
      if (response?.data) {
        return response.data;
      }
    } catch {
      return applyLocalStockAdjustment({ productId, delta: numDelta, type, reason });
    }
    return applyLocalStockAdjustment({ productId, delta: numDelta, type, reason });
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
