'use client';

import { format, isValid, subDays } from 'date-fns';
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
import { buildDailyChartData } from '@/features/finances/helpers/chart';
import { formatCurrency } from '@/helpers/currency';
import { useIsMobile } from '@/hooks/use-mobile';

import DateSelection from './date-selection';

export const description =
  'Gráfico interativo de fluxo de caixa comparando entradas e saídas';

const chartConfig = {
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
 * Gráfico de área interativo de fluxo de caixa diário.
 * Compara receitas (entradas) com despesas e investimentos (saídas).
 *
 * @param {{
 *   transactions?: Array<Object>,
 *   from?: string,
 *   to?: string,
 *   onPresetChange?: (preset: string) => void,
 *   onDateRangeChange?: (range: { from: string, to: string }) => void,
 *   activePreset?: string | null,
 *   isLoading?: boolean,
 * }} props
 */
export const ChartAreaInteractive = ({
  transactions = [],
  from,
  to,
  onPresetChange,
  onDateRangeChange,
  activePreset,
  isLoading = false,
}) => {
  const isMobile = useIsMobile();
  const [internalPreset, setInternalPreset] = useState('90d');

  React.useEffect(() => {
    if (isMobile && activePreset === undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInternalPreset('7d');
    }
  }, [isMobile, activePreset]);

  const effectivePreset =
    activePreset !== undefined ? activePreset : internalPreset;

  const handlePresetChange = (value) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    if (nextValue) {
      if (onPresetChange) {
        onPresetChange(nextValue);
      }
      setInternalPreset(nextValue);
    }
  };

  const effectiveFrom = useMemo(() => {
    if (from) return from;
    const now = new Date();
    const days =
      effectivePreset === '7d' ? 7 : effectivePreset === '30d' ? 30 : 90;
    return format(subDays(now, days - 1), 'yyyy-MM-dd');
  }, [from, effectivePreset]);

  const effectiveTo = useMemo(() => {
    if (to) return to;
    return format(new Date(), 'yyyy-MM-dd');
  }, [to]);

  const chartData = useMemo(() => {
    return buildDailyChartData(transactions, effectiveFrom, effectiveTo);
  }, [transactions, effectiveFrom, effectiveTo]);

  const descriptionLong = useMemo(() => {
    if (effectivePreset === '7d') return 'Total dos últimos 7 dias';
    if (effectivePreset === '30d') return 'Total dos últimos 30 dias';
    if (effectivePreset === '90d') return 'Total dos últimos 3 meses';
    return 'Total do período selecionado';
  }, [effectivePreset]);

  const descriptionShort = useMemo(() => {
    if (effectivePreset === '7d') return 'Últimos 7 dias';
    if (effectivePreset === '30d') return 'Últimos 30 dias';
    if (effectivePreset === '90d') return 'Últimos 3 meses';
    return 'Período selecionado';
  }, [effectivePreset]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">{descriptionLong}</span>
          <span className="@[540px]/card:hidden">{descriptionShort}</span>
        </CardDescription>
        <CardAction className="flex gap-2">
          <DateSelection
            from={effectiveFrom}
            to={effectiveTo}
            onDateRangeChange={onDateRangeChange}
          />
          <ToggleGroup
            type="single"
            value={effectivePreset ?? ''}
            onValueChange={handlePresetChange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={effectivePreset ?? ''}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="Últimos 3 meses" />
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
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
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
                            {chartConfig[name]?.label ?? name}
                          </span>
                        </div>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {formatCurrency(Number(value) || 0)}
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

export default ChartAreaInteractive;
