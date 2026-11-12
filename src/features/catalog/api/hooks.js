import { useQuery } from '@tanstack/react-query';

import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import { CatalogService } from '@/features/catalog/api/services';

export const getCatalogMetricsQueryKey = ({ userId, shopId } = {}) => [
  'catalogMetrics',
  userId,
  shopId,
];

/**
 * Hook to retrieve high-level operational catalog metrics for the active shop.
 *
 * @param {object} [options]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetCatalogMetrics = (options = {}) => {
  const { user } = useAuthContext();
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: getCatalogMetricsQueryKey({ userId: user?.id, shopId }),
    queryFn: () => CatalogService.getMetrics({ shopId }),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(user?.id) && Boolean(shopId),
    ...options,
  });
};

export const getStockMovementsQueryKey = ({
  userId,
  shopId,
  from,
  to,
  period,
} = {}) => [
  'stockMovements',
  userId,
  shopId,
  {
    from,
    to,
    period,
  },
];

/**
 * Hook to retrieve stock movements ledger and time-series for the active shop.
 *
 * @param {{ from?: string, to?: string, period?: string }} [params]
 * @param {object} [options]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetStockMovements = (
  { from, to, period } = {},
  options = {}
) => {
  const { user } = useAuthContext();
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: getStockMovementsQueryKey({
      userId: user?.id,
      shopId,
      from,
      to,
      period,
    }),
    queryFn: () =>
      CatalogService.getStockMovements({
        shopId,
        from,
        to,
        period,
      }),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(user?.id) && Boolean(shopId),
    ...options,
  });
};
