import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { useMemo } from 'react';

import { KpiCard } from '@/components/shared/kpi-card';
import { getAvailableStock } from '@/features/catalog/helpers/bundle';
import { formatCurrency } from '@/helpers/currency';
import { cn } from '@/lib/utils';

/**
 * Formats a trend number as a signed percentage string (e.g. +12%, -5%, 0%).
 *
 * @param {number | string | null | undefined} value
 * @returns {string}
 */
const formatTrendPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num) || num === 0) return '0%';
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1);
  return num > 0 ? `+${formatted}%` : `${formatted}%`;
};

/**
 * Resolves available stock units for a product or bundle.
 *
 * @param {Object} product
 * @param {Array<Object>} allProducts
 * @returns {number | null}
 */
const resolveAvailableUnits = (product, allProducts = []) => {
  if (!product) return 0;
  if (product.type === 'service' && !product.is_bundle) {
    return null;
  }

  if (product.is_bundle) {
    const rawItems = product.bundle_items ?? product.bundleItems ?? [];
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      return getAvailableStock(product, allProducts) ?? 0;
    }
    return Math.max(
      0,
      Number(product.available_stock ?? product.availableStock ?? 0)
    );
  }

  if (product?.stock?.quantity != null || product?.quantity != null) {
    return getAvailableStock(product, allProducts) ?? 0;
  }

  return Math.max(
    0,
    Number(product?.available_stock ?? product?.availableStock ?? 0)
  );
};

/**
 * Catalog operational health KPI cards using the shared KpiCard primitive.
 * Displays 4 real-time KPI cards:
 * 1. Total de Produtos
 * 2. Valor do Catálogo
 * 3. Unidades Disponíveis
 * 4. Alertas de Estoque
 *
 * @param {{
 *   products?: Array<Object>,
 *   metrics?: Object,
 *   isLoading?: boolean,
 *   className?: string,
 * }} props
 */
const CatalogMetrics = ({
  products = [],
  metrics,
  isLoading = false,
  className,
}) => {
  const computed = useMemo(() => {
    const hasProducts = Array.isArray(products) && products.length > 0;

    if (hasProducts) {
      let simpleCount = 0;
      let bundleCount = 0;
      let catalogValueTotal = 0;
      let availableUnitsTotal = 0;
      let reservedUnitsTotal = 0;
      let alertsCount = 0;

      for (const product of products) {
        const isBundle = Boolean(product?.is_bundle);
        const price = Number(product?.price) || 0;
        const available = resolveAvailableUnits(product, products);

        if (isBundle) {
          bundleCount += 1;
        } else {
          simpleCount += 1;
          const reserved = Number(
            product?.stock?.reserved ?? product?.reserved ?? 0
          );
          reservedUnitsTotal += reserved;
          if (available !== null) {
            availableUnitsTotal += available;
          }
        }

        const effectiveStockForValue = Math.max(1, available ?? 0);
        catalogValueTotal += price * effectiveStockForValue;

        if (available !== null && available <= 3) {
          alertsCount += 1;
        }
      }

      return {
        totalProducts: products.length,
        simpleCount,
        bundleCount,
        catalogValueTotal,
        availableUnitsTotal,
        reservedUnitsTotal,
        alertsCount,
        catalogTrend: metrics?.activeCatalog?.trend ?? 0,
        valueTrend: metrics?.catalogValue?.trend ?? 0,
        rentalsTrend: metrics?.activeRentals?.trend ?? 0,
        alertsTrend: metrics?.stockAlerts?.trend ?? 0,
      };
    }

    return {
      totalProducts: metrics?.activeCatalog?.total ?? 0,
      simpleCount: metrics?.activeCatalog?.simpleProducts ?? 0,
      bundleCount: metrics?.activeCatalog?.bundles ?? 0,
      catalogValueTotal: metrics?.catalogValue?.total ?? 0,
      availableUnitsTotal:
        metrics?.availableUnits?.total ?? metrics?.activeRentals?.total ?? 0,
      reservedUnitsTotal:
        metrics?.availableUnits?.reserved ??
        metrics?.activeRentals?.reserved ??
        0,
      alertsCount: metrics?.stockAlerts?.total ?? 0,
      catalogTrend: metrics?.activeCatalog?.trend ?? 0,
      valueTrend: metrics?.catalogValue?.trend ?? 0,
      rentalsTrend: metrics?.activeRentals?.trend ?? 0,
      alertsTrend: metrics?.stockAlerts?.trend ?? 0,
    };
  }, [products, metrics]);

  const {
    totalProducts,
    simpleCount,
    bundleCount,
    catalogValueTotal,
    availableUnitsTotal,
    reservedUnitsTotal,
    alertsCount,
    catalogTrend,
    valueTrend,
    rentalsTrend,
    alertsTrend,
  } = computed;

  return (
    <div
      data-testid="catalog-metrics-grid"
      aria-busy={isLoading}
      className={cn(
        '*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4',
        className
      )}
    >
      {isLoading && (
        <span
          className="sr-only"
          role="status"
          aria-label="Carregando indicadores do catálogo..."
        >
          Carregando indicadores do catálogo...
        </span>
      )}

      {/* 1. Total de Produtos */}
      <KpiCard
        testId="metric-card-active-catalog"
        title="Total de Produtos"
        value={totalProducts}
        badgeIcon={
          catalogTrend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />
        }
        badgeText={formatTrendPercentage(catalogTrend)}
        footerTitle={`${simpleCount} produtos simples e ${bundleCount} pacotes`}
        footerIcon={
          catalogTrend >= 0 ? (
            <TrendingUpIcon className="size-4" />
          ) : (
            <TrendingDownIcon className="size-4" />
          )
        }
        footerSubtitle="Itens cadastrados no catálogo da loja"
        isLoading={isLoading}
      />

      {/* 2. Valor do Catálogo */}
      <KpiCard
        testId="metric-card-catalog-value"
        title="Valor do Catálogo"
        value={formatCurrency(catalogValueTotal)}
        badgeIcon={valueTrend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
        badgeText={formatTrendPercentage(valueTrend)}
        footerTitle="Potencial financeiro ativo"
        footerIcon={
          valueTrend >= 0 ? (
            <TrendingUpIcon className="size-4" />
          ) : (
            <TrendingDownIcon className="size-4" />
          )
        }
        footerSubtitle="Baseado no estoque e preços unitários"
        isLoading={isLoading}
      />

      {/* 3. Unidades Disponíveis */}
      <KpiCard
        testId="metric-card-active-rentals"
        title="Unidades Disponíveis"
        value={availableUnitsTotal}
        badgeIcon={
          rentalsTrend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />
        }
        badgeText={formatTrendPercentage(rentalsTrend)}
        footerTitle={`${reservedUnitsTotal} unidades reservadas em eventos`}
        footerIcon={
          rentalsTrend >= 0 ? (
            <TrendingUpIcon className="size-4" />
          ) : (
            <TrendingDownIcon className="size-4" />
          )
        }
        footerSubtitle="Prontas para locação ou venda imediata"
        isLoading={isLoading}
      />

      {/* 4. Alertas de Estoque */}
      <KpiCard
        testId="metric-card-stock-alerts"
        title="Alertas de Estoque"
        value={alertsCount}
        badgeVariant={alertsCount > 0 ? 'destructive' : 'outline'}
        badgeIcon={alertsTrend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
        badgeText={formatTrendPercentage(alertsTrend)}
        footerTitle={
          alertsCount > 0
            ? 'Atenção à reposição de itens'
            : 'Estoque operando normalmente'
        }
        footerIcon={
          alertsTrend >= 0 ? (
            <TrendingUpIcon className="size-4" />
          ) : (
            <TrendingDownIcon className="size-4" />
          )
        }
        footerSubtitle="Produtos esgotados ou pacotes com gargalo"
        isLoading={isLoading}
      />
    </div>
  );
};

export default CatalogMetrics;
