import { describe, expect, it } from 'vitest';

import {
  calculateBundleBottleneck,
  getAvailableStock,
} from '@/features/catalog/helpers/bundle';

describe('bundle helpers', () => {
  describe('getAvailableStock for simple products', () => {
    it('returns null for service products as stock does not apply', () => {
      const serviceProduct = {
        id: 'p-srv',
        name: 'Montagem de Balões',
        type: 'service',
        stock: null,
      };

      expect(getAvailableStock(serviceProduct)).toBeNull();
    });

    it('calculates available stock as quantity - reserved for sale products', () => {
      const saleProduct = {
        id: 'p-sale',
        name: 'Vela Decorativa',
        type: 'sale',
        stock: { quantity: 50, reserved: 15 },
      };

      expect(getAvailableStock(saleProduct)).toBe(35);
    });

    it('calculates available stock as quantity - reserved for rent products', () => {
      const rentProduct = {
        id: 'p-rent',
        name: 'Mesa Rústica',
        type: 'rent',
        stock: { quantity: 10, reserved: 3 },
      };

      expect(getAvailableStock(rentProduct)).toBe(7);
    });

    it('clamps negative stock to 0 if reserved exceeds quantity', () => {
      const overbookedProduct = {
        id: 'p-over',
        name: 'Painel Redondo',
        type: 'rent',
        stock: { quantity: 2, reserved: 5 },
      };

      expect(getAvailableStock(overbookedProduct)).toBe(0);
    });

    it('handles missing stock object safely by defaulting to 0', () => {
      const productWithoutStock = {
        id: 'p-no-stock',
        name: 'Item sem estoque',
        type: 'rent',
      };

      expect(getAvailableStock(productWithoutStock)).toBe(0);
    });
  });

  describe('calculateBundleBottleneck', () => {
    const tableProduct = {
      id: 'prod-table',
      name: 'Mesa Provençal',
      type: 'rent',
      stock: { quantity: 15, reserved: 3 }, // available = 12
    };

    const cakeProduct = {
      id: 'prod-cake',
      name: 'Bolo Cenográfico',
      type: 'rent',
      stock: { quantity: 8, reserved: 2 }, // available = 6
    };

    const standsProduct = {
      id: 'prod-stands',
      name: 'Suporte para Doces',
      type: 'rent',
      stock: { quantity: 30, reserved: 6 }, // available = 24
    };

    const allProducts = [tableProduct, cakeProduct, standsProduct];

    it('returns 0 available stock when bundle has no items', () => {
      const emptyBundle = {
        id: 'b-empty',
        name: 'Pacote Vazio',
        is_bundle: true,
        bundle_items: [],
      };

      const result = calculateBundleBottleneck(emptyBundle, allProducts);
      expect(result.availableStock).toBe(0);
      expect(result.components).toEqual([]);
      expect(result.bottlenecks).toEqual([]);
    });

    it('calculates dynamic bottleneck stock when components are in allProducts lookup', () => {
      const bundle = {
        id: 'b-1',
        name: 'Kit Festa Provençal',
        is_bundle: true,
        bundle_items: [
          { product_id: 'prod-table', quantity: 1 }, // 12 / 1 = 12
          { product_id: 'prod-cake', quantity: 1 }, // 6 / 1 = 6 (bottleneck)
          { product_id: 'prod-stands', quantity: 4 }, // 24 / 4 = 6 (bottleneck)
        ],
      };

      const result = calculateBundleBottleneck(bundle, allProducts);
      expect(result.availableStock).toBe(6);
      expect(result.components).toHaveLength(3);

      const tableComp = result.components.find(
        (c) => c.productId === 'prod-table'
      );
      expect(tableComp.availableStock).toBe(12);
      expect(tableComp.multiplier).toBe(1);
      expect(tableComp.maxBundles).toBe(12);
      expect(tableComp.isBottleneck).toBe(false);

      const cakeComp = result.components.find(
        (c) => c.productId === 'prod-cake'
      );
      expect(cakeComp.availableStock).toBe(6);
      expect(cakeComp.multiplier).toBe(1);
      expect(cakeComp.maxBundles).toBe(6);
      expect(cakeComp.isBottleneck).toBe(true);

      const standsComp = result.components.find(
        (c) => c.productId === 'prod-stands'
      );
      expect(standsComp.availableStock).toBe(24);
      expect(standsComp.multiplier).toBe(4);
      expect(standsComp.maxBundles).toBe(6);
      expect(standsComp.isBottleneck).toBe(true);

      expect(result.bottlenecks).toHaveLength(2);
    });

    it('identifies single clear bottleneck limiting component', () => {
      const bundle = {
        id: 'b-single-bottleneck',
        name: 'Combo Arco + Mesa',
        is_bundle: true,
        bundle_items: [
          {
            product_id: 'prod-table',
            quantity: 2, // 12 / 2 = 6
          },
          {
            product_id: 'prod-cake',
            quantity: 3, // 6 / 3 = 2 (limiting bottleneck!)
          },
        ],
      };

      const result = calculateBundleBottleneck(bundle, allProducts);
      expect(result.availableStock).toBe(2);
      expect(result.bottlenecks).toHaveLength(1);
      expect(result.bottlenecks[0].productId).toBe('prod-cake');
      expect(result.bottlenecks[0].name).toBe('Bolo Cenográfico');
    });

    it('supports embedded componentProduct objects directly on bundle_items', () => {
      const bundleWithEmbedded = {
        id: 'b-embedded',
        name: 'Kit Completo',
        is_bundle: true,
        bundle_items: [
          {
            product_id: 'prod-custom-1',
            quantity: 2,
            componentProduct: {
              id: 'prod-custom-1',
              name: 'Arco Orgânico',
              type: 'sale',
              stock: { quantity: 10, reserved: 4 }, // available: 6 / 2 = 3
            },
          },
          {
            product_id: 'prod-custom-2',
            quantity: 1,
            componentProduct: {
              id: 'prod-custom-2',
              name: 'Vela Personalizada',
              type: 'sale',
              stock: { quantity: 20, reserved: 2 }, // available: 18 / 1 = 18
            },
          },
        ],
      };

      const result = calculateBundleBottleneck(bundleWithEmbedded);
      expect(result.availableStock).toBe(3);
      expect(result.bottlenecks).toHaveLength(1);
      expect(result.bottlenecks[0].productId).toBe('prod-custom-1');
      expect(result.bottlenecks[0].isBottleneck).toBe(true);
    });

    it('returns 0 available stock when any component is completely out of stock', () => {
      const depletedProduct = {
        id: 'prod-depleted',
        name: 'Painel Neon',
        type: 'rent',
        stock: { quantity: 2, reserved: 2 }, // available: 0
      };

      const bundle = {
        id: 'b-depleted',
        name: 'Kit com Item Esgotado',
        is_bundle: true,
        bundle_items: [
          { product_id: 'prod-table', quantity: 1 },
          { product_id: 'prod-depleted', quantity: 1 },
        ],
      };

      const result = calculateBundleBottleneck(bundle, [
        tableProduct,
        depletedProduct,
      ]);
      expect(result.availableStock).toBe(0);
      expect(result.bottlenecks).toHaveLength(1);
      expect(result.bottlenecks[0].productId).toBe('prod-depleted');
      expect(result.bottlenecks[0].maxBundles).toBe(0);
    });

    it('getAvailableStock delegates to calculateBundleBottleneck for bundles', () => {
      const bundle = {
        id: 'b-delegation',
        name: 'Kit Teste',
        is_bundle: true,
        bundle_items: [{ product_id: 'prod-table', quantity: 2 }], // 12 / 2 = 6
      };

      expect(getAvailableStock(bundle, [tableProduct])).toBe(6);
    });
  });
});
