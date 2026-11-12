import {
  DEFAULT_CATALOG_METRICS,
  DEFAULT_STOCK_MOVEMENTS,
  DEFAULT_STOCK_MOVEMENTS_SERIES,
} from '@/features/catalog/api/fixtures';
import protectedApi from '@/lib/axios';

export const CatalogService = {
  /**
   * Fetches high-level operational metrics for the active shop's catalog.
   * Falls back gracefully to default domain fixtures when backend route is unavailable.
   *
   * @param {{ shopId?: string }} [input]
   * @returns {Promise<typeof DEFAULT_CATALOG_METRICS>}
   */
  getMetrics: async ({ shopId } = {}) => {
    if (!shopId) {
      return DEFAULT_CATALOG_METRICS;
    }
    try {
      const response = await protectedApi.get(
        `/shops/${shopId}/catalog/metrics`
      );
      return response?.data ?? DEFAULT_CATALOG_METRICS;
    } catch {
      return DEFAULT_CATALOG_METRICS;
    }
  },

  /**
   * Fetches stock movement ledger records and aggregated time-series data.
   * Falls back gracefully to default domain fixtures when backend route is unavailable.
   *
   * @param {{ shopId?: string, from?: string, to?: string }} [input]
   * @returns {Promise<{ movements: Array<object>, series: Array<object> }>}
   */
  getStockMovements: async ({ shopId, from, to } = {}) => {
    if (!shopId) {
      return {
        movements: DEFAULT_STOCK_MOVEMENTS,
        series: DEFAULT_STOCK_MOVEMENTS_SERIES,
      };
    }
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await protectedApi.get(
        `/shops/${shopId}/stock/movements`,
        { params }
      );
      return (
        response?.data ?? {
          movements: DEFAULT_STOCK_MOVEMENTS,
          series: DEFAULT_STOCK_MOVEMENTS_SERIES,
        }
      );
    } catch {
      return {
        movements: DEFAULT_STOCK_MOVEMENTS,
        series: DEFAULT_STOCK_MOVEMENTS_SERIES,
      };
    }
  },
};
