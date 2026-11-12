'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DEFAULT_STOCK_MOVEMENTS_SERIES } from '@/features/catalog/api/fixtures';
import { cn } from '@/lib/utils';

export const stockMovementChartConfig = {
  inbound: {
    label: 'Entradas',
    color: 'var(--chart-1)',
  },
  sale: {
    label: 'Vendas',
    color: 'var(--chart-2)',
  },
  rentalAllocation: {
    label: 'Locações',
    color: 'var(--chart-3)',
  },
  loss: {
    label: 'Avarias / Perdas',
    color: 'var(--chart-4)',
  },
};

/**
 * Interactive stock movements chart component powered by Recharts and ChartContainer.
 * Visualizes stock flow across INBOUND, SALE, RENTAL_ALLOCATION, and LOSS ledger types.
 *
 * @param {{
 *   data?: Array<{
 *     day: string,
 *     date?: string,
 *     inbound: number,
 *     sale: number,
 *     rentalAllocation: number,
 *     loss: number,
 *   }>,
 *   movements?: object,
 *   period?: string,
 *   onPeriodChange?: (period: string) => void,
 *   isLoading?: boolean,
 *   className?: string,
 * }} props
 */
const StockMovementsChart = ({
  data,
  movements,
  period,
  onPeriodChange,
  isLoading = false,
  className,
}) => {
  const [internalPeriod, setInternalPeriod] = useState('7d');

  const effectivePeriod = period !== undefined ? period : internalPeriod;

  const handlePeriodChange = (nextValue) => {
    if (!nextValue) return;
    if (onPeriodChange) {
      onPeriodChange(nextValue);
    } else {
      setInternalPeriod(nextValue);
    }
  };

  const chartData = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data;
    if (Array.isArray(movements?.series) && movements.series.length > 0) {
      return movements.series;
    }
    if (Array.isArray(movements) && movements.length > 0) return movements;
    return DEFAULT_STOCK_MOVEMENTS_SERIES;
  }, [data, movements]);

  const summary = useMemo(() => {
    return chartData.reduce(
      (acc, item) => {
        acc.inbound += Number(item?.inbound) || 0;
        acc.sale += Number(item?.sale) || 0;
        acc.rentalAllocation += Number(item?.rentalAllocation) || 0;
        acc.loss += Number(item?.loss) || 0;
        return acc;
      },
      { inbound: 0, sale: 0, rentalAllocation: 0, loss: 0 }
    );
  }, [chartData]);

  return (
    <Card
      data-testid="stock-movements-card"
      aria-busy={isLoading}
      className={cn('@container/card flex flex-col', className)}
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

      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight">
            Movimentações de Estoque
          </CardTitle>
          <CardDescription>
            Fluxo operacional semanal de itens
          </CardDescription>

          {/* Summary Indicators */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div
              data-testid="summary-inbound"
              className="bg-muted/50 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: 'var(--chart-1)' }}
              />
              <span className="text-muted-foreground">Entradas:</span>
              <span className="text-foreground font-semibold tabular-nums">
                {summary.inbound} un
              </span>
            </div>

            <div
              data-testid="summary-sale"
              className="bg-muted/50 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: 'var(--chart-2)' }}
              />
              <span className="text-muted-foreground">Vendas:</span>
              <span className="text-foreground font-semibold tabular-nums">
                {summary.sale} un
              </span>
            </div>

            <div
              data-testid="summary-rental"
              className="bg-muted/50 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: 'var(--chart-3)' }}
              />
              <span className="text-muted-foreground">Locações:</span>
              <span className="text-foreground font-semibold tabular-nums">
                {summary.rentalAllocation} un
              </span>
            </div>

            <div
              data-testid="summary-loss"
              className="bg-muted/50 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: 'var(--chart-4)' }}
              />
              <span className="text-muted-foreground">Avarias / Perdas:</span>
              <span className="text-foreground font-semibold tabular-nums">
                {summary.loss} un
              </span>
            </div>
          </div>
        </div>

        <CardAction className="self-start">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={effectivePeriod}
            onValueChange={handlePeriodChange}
            className="hidden sm:inline-flex"
          >
            <ToggleGroupItem value="7d" aria-label="7 dias">
              7 dias
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" aria-label="30 dias">
              30 dias
            </ToggleGroupItem>
            <ToggleGroupItem value="90d" aria-label="90 dias">
              90 dias
            </ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex h-72 w-full flex-col gap-2">
            <Skeleton
              data-slot="skeleton"
              className="h-full w-full rounded-xl"
            />
          </div>
        ) : (
          <ChartContainer
            data-testid="stock-movements-chart"
            config={stockMovementChartConfig}
            className="aspect-auto h-72 w-full"
          >
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-border/50"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="inbound"
                name="Entradas"
                fill="var(--color-inbound)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="sale"
                name="Vendas"
                fill="var(--color-sale)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="rentalAllocation"
                name="Locações"
                fill="var(--color-rentalAllocation)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="loss"
                name="Avarias / Perdas"
                fill="var(--color-loss)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default StockMovementsChart;
