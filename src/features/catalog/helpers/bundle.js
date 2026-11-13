/**
 * @typedef {Object} Stock
 * @property {number} [quantity]
 * @property {number} [reserved]
 */

/**
 * @typedef {Object} ComponentBreakdown
 * @property {string} id
 * @property {string} productId
 * @property {string} name
 * @property {string} type
 * @property {number} multiplier
 * @property {number} onHand
 * @property {number} reserved
 * @property {number} availableStock
 * @property {number} maxBundles
 * @property {boolean} isBottleneck
 */

/**
 * @typedef {Object} BundleBottleneckResult
 * @property {number} availableStock
 * @property {ComponentBreakdown[]} components
 * @property {ComponentBreakdown[]} bottlenecks
 * @property {number} minRatio
 */

/**
 * Calculates physical or dynamic bottleneck available stock for a product.
 * - Simple sale/rent products: `max(0, quantity - reserved)`
 * - Service products: `null` (stock not applicable)
 * - Virtual Bundles: `min_i floor((quantity_i - reserved_i) / multiplier_i)`
 *
 * @param {Object} product
 * @param {Array<Object> | Map<string, Object>} [allProducts]
 * @returns {number | null}
 */
export const getAvailableStock = (product, allProducts = []) => {
  if (!product) return 0;

  if (product.type === 'service') {
    return null;
  }

  if (product.is_bundle) {
    return calculateBundleBottleneck(product, allProducts).availableStock;
  }

  const quantity = Number(product.stock?.quantity ?? product.quantity ?? 0);
  const reserved = Number(product.stock?.reserved ?? product.reserved ?? 0);

  return Math.max(0, quantity - reserved);
};

/**
 * Calculates dynamic bottleneck stock and identifies limiting component(s)
 * for a virtual product bundle in accordance with ADR 0009.
 *
 * Formula:
 * Available Stock = min_i floor((stock.quantity_i - stock.reserved_i) / bundle_items.quantity_i)
 *
 * @param {Object} bundle
 * @param {Array<Object> | Map<string, Object>} [allProducts]
 * @returns {BundleBottleneckResult}
 */
export const calculateBundleBottleneck = (bundle, allProducts = []) => {
  if (!bundle) {
    return {
      availableStock: 0,
      components: [],
      bottlenecks: [],
      minRatio: 0,
    };
  }

  const rawItems = bundle.bundle_items ?? bundle.bundleItems ?? [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return {
      availableStock: 0,
      components: [],
      bottlenecks: [],
      minRatio: 0,
    };
  }

  const productsLookup =
    allProducts instanceof Map
      ? allProducts
      : new Map(
          (Array.isArray(allProducts) ? allProducts : []).map((prod) => [
            prod.id,
            prod,
          ])
        );

  const components = rawItems.map((item, index) => {
    const productId =
      item.product_id ??
      item.productId ??
      item.componentProduct?.id ??
      item.product?.id ??
      `comp-${index}`;

    const multiplier = Math.max(1, Number(item.quantity ?? 1));

    const componentProduct =
      item.componentProduct ?? item.product ?? productsLookup.get(productId);

    const name = componentProduct?.name ?? item.name ?? 'Componente';
    const type = componentProduct?.type ?? 'rent';

    const onHand = Number(
      componentProduct?.stock?.quantity ?? componentProduct?.quantity ?? 0
    );
    const reserved = Number(
      componentProduct?.stock?.reserved ?? componentProduct?.reserved ?? 0
    );

    const availableStock = Math.max(0, onHand - reserved);
    const maxBundles = Math.floor(availableStock / multiplier);

    return {
      id: item.id ?? `item-${productId}-${index}`,
      productId,
      name,
      type,
      multiplier,
      onHand,
      reserved,
      availableStock,
      maxBundles,
      isBottleneck: false,
    };
  });

  const minRatio =
    components.length > 0
      ? Math.min(...components.map((c) => c.maxBundles))
      : 0;

  const availableStock = Math.max(0, minRatio);

  const componentsWithBottleneck = components.map((c) => ({
    ...c,
    isBottleneck: c.maxBundles === minRatio,
  }));

  const bottlenecks = componentsWithBottleneck.filter((c) => c.isBottleneck);

  return {
    availableStock,
    components: componentsWithBottleneck,
    bottlenecks,
    minRatio,
  };
};
