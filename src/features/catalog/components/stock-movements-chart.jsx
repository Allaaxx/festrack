'use client';

import { eachDayOfInterval, format, isValid, subDays } from 'date-fns';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getAvailableStock } from '@/features/catalog/helpers/bundle';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export const stockMovementChartConfig = {
  entradas: {
    label: 'Entradas',
    color: 'var(--primary)',
  },
  saidas: {
    label: 'Saídas',
    color: 'var(--primary)',
  },
};

/**
 * Normalizes a date value to 'yyyy-MM-dd'.
 *
 * @param {string | Date | null | undefined} val
 * @returns {string}
 */
const getDateKey = (val) => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return val.slice(0, 10);
  }
  const parsed = val instanceof Date ? val : new Date(val);
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : '';
};

/**
 * Normalizes an existing series item into `{ date, entradas, saidas }`.
 *
 * @param {Object} item
 * @returns {{ date: string, entradas: number, saidas: number }}
 */
const normalizeSeriesPoint = (item = {}) => {
  const entradas =
    item.entradas != null
      ? Number(item.entradas) || 0
      : Number(item.inbound) || 0;

  const saidas =
    item.saidas != null
      ? Number(item.saidas) || 0
      : (Number(item.sale) || 0) +
        (Number(item.rentalAllocation) || 0) +
        (Number(item.loss) || 0);

  return {
    ...item,
    date: item.date ?? item.day ?? '',
    entradas,
    saidas,
  };
};

/**
 * Builds daily stock movement series for the selected period ('7d', '30d', '90d').
 * Aggregates real movement records or product stock into `entradas` and `saidas`,
 * or returns zero-filled daily dates when empty.
 *
 * @param {{
 *   data?: Array<Object>,
 *   movements?: Array<Object> | { movements?: Array<Object>, series?: Array<Object> },
 *   products?: Array<Object>,
 *   period?: string,
 * }} [options]
 * @returns {Array<{ date: string, entradas: number, saidas: number }>}
 */
export function buildDailyStockChartData({
  data,
  movements,
  products,
  period = '90d',
} = {}) {
  const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const providedSeries =
    Array.isArray(data) && data.length > 0
      ? data
      : Array.isArray(movements?.series) && movements.series.length > 0
        ? movements.series
        : null;

  if (providedSeries) {
    const normalized = providedSeries.map(normalizeSeriesPoint);
    return normalized.length > daysCount
      ? normalized.slice(-daysCount)
      : normalized;
  }

  const end = new Date();
  const start = subDays(end, daysCount - 1);

  let days;
  try {
    days = eachDayOfInterval({ start, end });
  } catch {
    return [];
  }

  const dailyMap = new Map();
  for (const day of days) {
    const dateKey = format(day, 'yyyy-MM-dd');
    dailyMap.set(dateKey, {
      date: dateKey,
      entradas: 0,
      saidas: 0,
    });
  }

  const rawMovements = Array.isArray(movements)
    ? movements
    : Array.isArray(movements?.movements)
      ? movements.movements
      : [];

  if (rawMovements.length > 0) {
    for (const mov of rawMovements) {
      if (
        mov &&
        (mov.entradas != null ||
          mov.saidas != null ||
          mov.inbound != null ||
          mov.rentalAllocation != null)
      ) {
        const point = normalizeSeriesPoint(mov);
        const key = getDateKey(point.date);
        if (dailyMap.has(key)) {
          const existing = dailyMap.get(key);
          existing.entradas += point.entradas;
          existing.saidas += point.saidas;
        }
        continue;
      }

      const dateKey = getDateKey(
        mov?.date ?? mov?.created_at ?? mov?.createdAt
      );
      if (dailyMap.has(dateKey)) {
        const target = dailyMap.get(dateKey);
        const rawDelta = Number(
          mov?.quantity ?? mov?.quantityDelta ?? mov?.delta ?? 0
        );
        const qty = Math.abs(rawDelta);
        const type = String(mov?.type ?? '').toUpperCase();

        if (
          type === 'INBOUND' ||
          type === 'RENTAL_RETURN' ||
          (type === 'ADJUSTMENT' && rawDelta > 0)
        ) {
          target.entradas += qty;
        } else if (
          type === 'SALE' ||
          type === 'OUTBOUND' ||
          type === 'RENTAL_ALLOCATION' ||
          type === 'RESERVATION' ||
          type === 'LOSS' ||
          (type === 'ADJUSTMENT' && rawDelta < 0)
        ) {
          target.saidas += qty;
        }
      }
    }
  } else if (Array.isArray(products) && products.length > 0) {
    const todayKey = format(end, 'yyyy-MM-dd');
    for (const product of products) {
      if (product?.is_bundle || product?.type === 'service') continue;
      const dateKey =
        getDateKey(
          product?.updated_at ??
            product?.updatedAt ??
            product?.created_at ??
            product?.createdAt
        ) || todayKey;
      const targetKey = dailyMap.has(dateKey) ? dateKey : todayKey;
      if (dailyMap.has(targetKey)) {
        const target = dailyMap.get(targetKey);
        const reserved = Number(
          product?.stock?.reserved ?? product?.reserved ?? 0
        );
        const available = getAvailableStock(product, products) ?? 0;
        target.entradas += available;
        target.saidas += reserved;
      }
    }
  }

  return Array.from(dailyMap.values());
}

/**
 * Interactive area chart visualizing inventory flow (Entradas vs Saídas)
 * matching the visual design and structure of ChartAreaInteractive in finances.
 *
 * @param {{
 *   data?: Array<Object>,
 *   movements?: Object | Array<Object>,
 *   products?: Array<Object>,
 *   period?: string,
 *   onPeriodChange?: (period: string) => void,
 *   isLoading?: boolean,
 *   className?: string,
 * }} props
 */
const StockMovementsChart = ({
  data,
  movements,
  products,
  period,
  onPeriodChange,
  isLoading = false,
  className,
}) => {
  const isMobile = useIsMobile();
  const [internalPeriod, setInternalPeriod] = useState('90d');

  React.useEffect(() => {
    if (isMobile && period === undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInternalPeriod('7d');
    }
  }, [isMobile, period]);

  const effectivePeriod = period !== undefined ? period : internalPeriod;

  const handlePeriodChange = (value) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    if (nextValue) {
      if (onPeriodChange) {
        onPeriodChange(nextValue);
      }
      setInternalPeriod(nextValue);
    }
  };

  const chartData = useMemo(() => {
    return buildDailyStockChartData({
      data,
      movements,
      products,
      period: effectivePeriod,
    });
  }, [data, movements, products, effectivePeriod]);

  const descriptionLong = useMemo(() => {
    if (effectivePeriod === '7d') return 'Total dos últimos 7 dias';
    if (effectivePeriod === '30d') return 'Total dos últimos 30 dias';
    if (effectivePeriod === '90d') return 'Total dos últimos 3 meses';
    return 'Total do período selecionado';
  }, [effectivePeriod]);

  const descriptionShort = useMemo(() => {
    if (effectivePeriod === '7d') return 'Últimos 7 dias';
    if (effectivePeriod === '30d') return 'Últimos 30 dias';
    if (effectivePeriod === '90d') return 'Últimos 3 meses';
    return 'Período selecionado';
  }, [effectivePeriod]);

  return (
    <Card
      data-testid="stock-movements-card"
      aria-busy={isLoading}
      className={cn('@container/card', className)}
    >
      {isLoading && (
        <span
          className="sr-only"
          role="status"
          aria-label="Carregando gráfico de movimentações..."
        >
          Carregando gráfico de movimentações...
        </span>
      )}

      <CardHeader className="flex flex-col sm:grid md:flex-row">
        <CardTitle>Fluxo de Estoque</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">{descriptionLong}</span>
          <span className="@[540px]/card:hidden">{descriptionShort}</span>
        </CardDescription>
        <CardAction className="flex flex-col gap-2 sm:flex-row">
          <ToggleGroup
            type="single"
            value={effectivePeriod ?? ''}
            onValueChange={handlePeriodChange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={effectivePeriod ?? ''}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div
            data-testid="chart-loading"
            className="flex h-62.5 w-full items-center justify-center"
          >
            <Skeleton
              data-slot="skeleton"
              className="h-full w-full rounded-lg"
            />
          </div>
        ) : (
          <ChartContainer
            data-testid="stock-movements-chart"
            config={stockMovementChartConfig}
            className="aspect-auto h-62.5 w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-entradas)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-entradas)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-saidas)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-saidas)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <YAxis domain={[0, 'auto']} hide />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  if (!value) return '';
                  const date = new Date(`${value}T00:00:00`);
                  return isValid(date)
                    ? date.toLocaleDateString('pt-BR', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : value;
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      if (!value) return '';
                      const date = new Date(`${value}T00:00:00`);
                      return isValid(date)
                        ? date.toLocaleDateString('pt-BR', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : value;
                    }}
                    formatter={(value, name, item) => (
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{
                              backgroundColor: item?.color ?? 'var(--primary)',
                            }}
                          />
                          <span className="text-muted-foreground">
                            {stockMovementChartConfig[name]?.label ?? name}
                          </span>
                        </div>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {Number(value) || 0} un
                        </span>
                      </div>
                    )}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="saidas"
                type="monotone"
                fill="url(#fillSaidas)"
                stroke="var(--color-saidas)"
                stackId="a"
              />
              <Area
                dataKey="entradas"
                type="monotone"
                fill="url(#fillEntradas)"
                stroke="var(--color-entradas)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default StockMovementsChart;
