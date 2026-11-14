import { getAvailableStock } from '@/features/catalog/helpers/bundle';
import protectedApi from '@/lib/axios';

export const EMPTY_CATALOG_METRICS = {
  activeCatalog: {
    total: 0,
    simpleProducts: 0,
    bundles: 0,
    trend: 0,
  },
  activeRentals: {
    total: 0,
    trend: 0,
  },
  stockAlerts: {
    total: 0,
    outOfStock: 0,
    criticalBottlenecks: 0,
    trend: 0,
  },
};

export const EMPTY_STOCK_MOVEMENTS = {
  movements: [],
  series: [],
};

const computeMetricsFromProducts = (products = []) => {
  if (!Array.isArray(products) || products.length === 0) {
    return EMPTY_CATALOG_METRICS;
  }

  let simpleProducts = 0;
  let bundles = 0;
  let activeRentalsTotal = 0;
  let outOfStock = 0;
  let criticalBottlenecks = 0;

  for (const product of products) {
    if (product.is_bundle) {
      bundles += 1;
      const avail = Number(
        product.available_stock ?? product.availableStock ?? 0
      );
      if (avail <= 0) {
        criticalBottlenecks += 1;
      }
    } else {
      simpleProducts += 1;
      const reserved = Number(
        product?.stock?.reserved ?? product?.reserved ?? 0
      );
      activeRentalsTotal += reserved;
      if (product.type !== 'service') {
        const available = getAvailableStock(product, products) ?? 0;
        if (available <= 0) {
          outOfStock += 1;
        }
      }
    }
  }

  return {
    activeCatalog: {
      total: products.length,
      simpleProducts,
      bundles,
      trend: 0,
    },
    activeRentals: {
      total: activeRentalsTotal,
      trend: 0,
    },
    stockAlerts: {
      total: outOfStock + criticalBottlenecks,
      outOfStock,
      criticalBottlenecks,
      trend: 0,
    },
  };
};

export const CatalogService = {
  /**
   * Fetches high-level operational metrics for the active shop's catalog.
   *
   * @param {{ shopId?: string }} [input]
   * @returns {Promise<typeof EMPTY_CATALOG_METRICS>}
   */
  getMetrics: async ({ shopId } = {}) => {
    if (!shopId) {
      return EMPTY_CATALOG_METRICS;
    }
    try {
      const response = await protectedApi.get(
        `/shops/${shopId}/catalog/metrics`
      );
      return response?.data ?? EMPTY_CATALOG_METRICS;
    } catch (error) {
      if (error?.response?.status === 404) {
        try {
          const productsResponse = await protectedApi.get(
            `/shops/${shopId}/products`
          );
          return computeMetricsFromProducts(productsResponse?.data);
        } catch {
          return EMPTY_CATALOG_METRICS;
        }
      }
      return EMPTY_CATALOG_METRICS;
    }
  },

  /**
   * Fetches stock movement ledger records and aggregated time-series data.
   *
   * @param {{ shopId?: string, from?: string, to?: string }} [input]
   * @returns {Promise<{ movements: Array<object>, series: Array<object> }>}
   */
  getStockMovements: async ({ shopId, from, to } = {}) => {
    if (!shopId) {
      return EMPTY_STOCK_MOVEMENTS;
    }
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await protectedApi.get(
        `/shops/${shopId}/stock/movements`,
        { params }
      );
      return response?.data ?? EMPTY_STOCK_MOVEMENTS;
    } catch (error) {
      if (error?.response?.status === 404) {
        try {
          const productsResponse = await protectedApi.get(
            `/shops/${shopId}/products`
          );
          const products = Array.isArray(productsResponse?.data)
            ? productsResponse.data
            : [];
          const physicalProducts = products.filter(
            (p) => !p.is_bundle && p.type !== 'service'
          );

          const movementLists = await Promise.all(
            physicalProducts.map(async (product) => {
              try {
                const movRes = await protectedApi.get(
                  `/shops/${shopId}/products/${product.id}/stock/movements`
                );
                const items = Array.isArray(movRes?.data) ? movRes.data : [];
                return items.map((m) => ({
                  ...m,
                  productId: product.id,
                  product_id: product.id,
                  productName: m.productName ?? product.name,
                  date: m.date ?? m.created_at ?? m.createdAt,
                  note: m.note ?? m.notes ?? '',
                }));
              } catch {
                return [];
              }
            })
          );

          const movements = movementLists
            .flat()
            .sort(
              (a, b) =>
                new Date(b.date || 0).getTime() -
                new Date(a.date || 0).getTime()
            );

          return {
            movements,
            series: [],
          };
        } catch {
          return EMPTY_STOCK_MOVEMENTS;
        }
      }
      return EMPTY_STOCK_MOVEMENTS;
    }
  },
};
