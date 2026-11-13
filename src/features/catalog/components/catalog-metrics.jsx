import {
  AlertTriangleIcon,
  BoxesIcon,
  CalendarClockIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_CATALOG_METRICS } from '@/features/catalog/api/fixtures';
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
 * Catalog operational health metrics cards inspired by dashboard-shell-04.
 * Displays:
 * 1. Catálogo Ativo (Total products + bundles with trend badge)
 * 2. Locações em Andamento (Units out on active event rentals)
 * 3. Alertas de Estoque (Out of stock items or critical bundle bottlenecks)
 *
 * @param {{
 *   metrics?: typeof DEFAULT_CATALOG_METRICS,
 *   isLoading?: boolean,
 *   className?: string,
 * }} props
 */
const CatalogMetrics = ({
  metrics = DEFAULT_CATALOG_METRICS,
  isLoading = false,
  className,
}) => {
  const activeCatalog = metrics?.activeCatalog ?? DEFAULT_CATALOG_METRICS.activeCatalog;
  const activeRentals = metrics?.activeRentals ?? DEFAULT_CATALOG_METRICS.activeRentals;
  const stockAlerts = metrics?.stockAlerts ?? DEFAULT_CATALOG_METRICS.stockAlerts;

  const catalogTrend = activeCatalog?.trend ?? 0;
  const rentalsTrend = activeRentals?.trend ?? 0;
  const alertsTrend = stockAlerts?.trend ?? 0;

  return (
    <div
      data-testid="catalog-metrics-grid"
      aria-busy={isLoading}
      className={cn(
        '*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs md:grid-cols-3',
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

      {/* 1. Catálogo Ativo */}
      <Card data-testid="metric-card-active-catalog" className="@container/card">
        <CardHeader className="flex flex-col sm:grid">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <BoxesIcon className="size-4" />
            </div>
            <CardDescription className="text-muted-foreground font-medium">
              Catálogo Ativo
            </CardDescription>
          </div>

          {isLoading ? (
            <Skeleton
              data-slot="skeleton"
              aria-hidden="true"
              className="mt-2 h-8 w-24"
            />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {activeCatalog?.total ?? 0}
            </CardTitle>
          )}

          <CardAction>
            {isLoading ? (
              <Skeleton
                data-slot="skeleton"
                aria-hidden="true"
                className="h-5 w-14 rounded-full"
              />
            ) : (
              <Badge variant="outline" className="gap-1 font-semibold">
                {catalogTrend >= 0 ? (
                  <TrendingUpIcon className="text-primary size-3.5" />
                ) : (
                  <TrendingDownIcon className="text-muted-foreground size-3.5" />
                )}
                {formatTrendPercentage(catalogTrend)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>

        <CardContent className="text-muted-foreground text-xs">
          {isLoading ? (
            <Skeleton
              data-slot="skeleton"
              aria-hidden="true"
              className="h-4 w-44"
            />
          ) : activeCatalog?.simpleProducts != null &&
            activeCatalog?.bundles != null ? (
            `${activeCatalog.simpleProducts} produtos simples, ${activeCatalog.bundles} pacotes virtuais`
          ) : (
            activeCatalog?.trendLabel ||
            'Total de produtos simples e pacotes virtuais'
          )}
        </CardContent>
      </Card>

      {/* 2. Locações em Andamento */}
      <Card data-testid="metric-card-active-rentals" className="@container/card">
        <CardHeader className="flex flex-col sm:grid">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <CalendarClockIcon className="size-4" />
            </div>
            <CardDescription className="text-muted-foreground font-medium">
              Locações em Andamento
            </CardDescription>
          </div>

          {isLoading ? (
            <Skeleton
              data-slot="skeleton"
              aria-hidden="true"
              className="mt-2 h-8 w-24"
            />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {activeRentals?.total ?? 0}
            </CardTitle>
          )}

          <CardAction>
            {isLoading ? (
              <Skeleton
                data-slot="skeleton"
                aria-hidden="true"
                className="h-5 w-14 rounded-full"
              />
            ) : (
              <Badge variant="outline" className="gap-1 font-semibold">
                {rentalsTrend >= 0 ? (
                  <TrendingUpIcon className="text-primary size-3.5" />
                ) : (
                  <TrendingDownIcon className="text-muted-foreground size-3.5" />
                )}
                {formatTrendPercentage(rentalsTrend)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>

        <CardContent className="text-muted-foreground text-xs">
          {isLoading ? (
            <Skeleton
              data-slot="skeleton"
              aria-hidden="true"
              className="h-4 w-44"
            />
          ) : (
            activeRentals?.trendLabel ||
            'Itens alocados em eventos com retorno pendente'
          )}
        </CardContent>
      </Card>

      {/* 3. Alertas de Estoque */}
      <Card data-testid="metric-card-stock-alerts" className="@container/card">
        <CardHeader className="flex flex-col sm:grid">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-lg',
                (stockAlerts?.total ?? 0) > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <AlertTriangleIcon className="size-4" />
            </div>
            <CardDescription className="text-muted-foreground font-medium">
              Alertas de Estoque
            </CardDescription>
          </div>

          {isLoading ? (
            <Skeleton
              data-slot="skeleton"
              aria-hidden="true"
              className="mt-2 h-8 w-24"
            />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stockAlerts?.total ?? 0}
            </CardTitle>
          )}

          <CardAction>
            {isLoading ? (
              <Skeleton
                data-slot="skeleton"
                aria-hidden="true"
                className="h-5 w-14 rounded-full"
              />
            ) : (
              <Badge
                variant={
                  (stockAlerts?.total ?? 0) > 0 ? 'destructive' : 'outline'
                }
                className="gap-1 font-semibold"
              >
                {alertsTrend !== 0 && (
                  alertsTrend < 0 ? (
                    <TrendingDownIcon className="size-3.5" />
                  ) : (
                    <TrendingUpIcon className="size-3.5" />
                  )
                )}
                {formatTrendPercentage(alertsTrend)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>

        <CardContent className="text-muted-foreground text-xs">
          {isLoading ? (
            <Skeleton
              data-slot="skeleton"
              aria-hidden="true"
              className="h-4 w-44"
            />
          ) : (
            stockAlerts?.trendLabel ||
            'Produtos com estoque zerado ou bundles com gargalo crítico'
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CatalogMetrics;
