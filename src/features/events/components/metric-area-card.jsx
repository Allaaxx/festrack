import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { useId, useMemo } from 'react';
import { Area, AreaChart } from 'recharts';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatCurrency } from '@/helpers/currency';
import { cn } from '@/lib/utils';

const VARIANT_CONFIG = {
  earning: {
    label: 'Receitas',
    color: 'var(--primary)',
    trendLabel: 'Volume de receitas',
  },
  EARNING: {
    label: 'Receitas',
    color: 'var(--primary)',
    trendLabel: 'Volume de receitas',
  },
  expense: {
    label: 'Despesas',
    color: 'var(--primary)',
    trendLabel: 'Volume de despesas',
  },
  EXPENSE: {
    label: 'Despesas',
    color: 'var(--primary)',
    trendLabel: 'Volume de despesas',
  },
  investment: {
    label: 'Investimentos',
    color: 'var(--primary)',
    trendLabel: 'Volume de investimentos',
  },
  INVESTMENT: {
    label: 'Investimentos',
    color: 'var(--primary)',
    trendLabel: 'Volume de investimentos',
  },
};

/**
 * Determines whether a percentage or trend indicator string is positive or negative.
 *
 * @param {string | number | null | undefined} badge
 * @returns {boolean}
 */
const isPositiveTrend = (badge) => {
  if (badge === null || badge === undefined) return true;
  const str = String(badge).trim();
  if (str.startsWith('-')) return false;
  const num = parseFloat(str.replace('%', '').replace('+', ''));
  if (Number.isNaN(num)) return true;
  return num >= 0;
};

/**
 * Card de métrica financeira com gráfico de área e tooltip formatado em BRL.
 *
 * @param {{
 *   title: string,
 *   value?: string,
 *   amount?: number,
 *   badge?: string,
 *   comparison?: string,
 *   variant?: 'earning' | 'expense' | 'investment' | 'EARNING' | 'EXPENSE' | 'INVESTMENT',
 *   color?: string,
 *   data?: Array<{ date?: string, label?: string, amount?: number, v?: number }>,
 *   className?: string,
 *   footer?: React.ReactNode,
 *   'data-testid'?: string,
 * }} props
 */
export function MetricAreaCard({
  title,
  value,
  amount,
  badge = '0%',
  comparison = 'do volume do evento',
  variant,
  color,
  data = [],
  className,
  footer,
  ...props
}) {
  const gradientId = useId().replace(/:/g, '');
  const variantConfig = variant ? VARIANT_CONFIG[variant] : undefined;
  const resolvedColor = color ?? variantConfig?.color ?? 'var(--primary)';
  const displayValue =
    value ??
    (amount !== undefined ? formatCurrency(amount) : formatCurrency(0));
  const isPositive = isPositiveTrend(badge);

  const chartConfig = useMemo(
    () => ({
      amount: {
        label: variantConfig?.label ?? title ?? 'Valor',
        color: resolvedColor,
      },
    }),
    [resolvedColor, title, variantConfig?.label]
  );

  const normalizedData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((point) => ({
        ...point,
        amount: Number(point?.amount ?? point?.v ?? 0),
      })),
    [data]
  );

  return (
    <Card
      className={cn(
        '@container/card col-span-2 flex flex-col justify-between max-lg:col-span-full',
        className
      )}
      {...props}
    >
      <CardHeader className="flex flex-col sm:grid md:flex-row">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {displayValue}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            {isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
            {badge}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="px-(--card-spacing) py-0">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-16 w-full"
        >
          <AreaChart
            data={normalizedData}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`fill-${gradientId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="10%"
                  stopColor={resolvedColor}
                  stopOpacity={0.8}
                />
                <stop
                  offset="90%"
                  stopColor={resolvedColor}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.label ||
                    payload?.[0]?.payload?.date ||
                    title
                  }
                  formatter={(val) => formatCurrency(Number(val) || 0)}
                />
              }
            />
            <Area
              dataKey="amount"
              type="monotone"
              fill={`url(#fill-${gradientId})`}
              fillOpacity={0.4}
              stroke={resolvedColor}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      {footer ?? (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {variantConfig?.trendLabel ?? 'Volume no período'}{' '}
            {isPositive ? (
              <TrendingUpIcon className="size-4" />
            ) : (
              <TrendingDownIcon className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">{comparison}</div>
        </CardFooter>
      )}
    </Card>
  );
}

export default MetricAreaCard;
