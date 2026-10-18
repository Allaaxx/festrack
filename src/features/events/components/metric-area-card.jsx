import { useId, useMemo } from 'react';
import { Area, AreaChart } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
    color: 'var(--color-primary-green)',
    badgeClassName:
      'bg-primary-green/10 text-primary-green hover:bg-primary-green/20',
  },
  EARNING: {
    label: 'Receitas',
    color: 'var(--color-primary-green)',
    badgeClassName:
      'bg-primary-green/10 text-primary-green hover:bg-primary-green/20',
  },
  expense: {
    label: 'Despesas',
    color: 'var(--color-primary-red)',
    badgeClassName:
      'bg-primary-red/10 text-primary-red hover:bg-primary-red/20',
  },
  EXPENSE: {
    label: 'Despesas',
    color: 'var(--color-primary-red)',
    badgeClassName:
      'bg-primary-red/10 text-primary-red hover:bg-primary-red/20',
  },
  investment: {
    label: 'Investimentos',
    color: 'var(--color-primary-blue)',
    badgeClassName:
      'bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20',
  },
  INVESTMENT: {
    label: 'Investimentos',
    color: 'var(--color-primary-blue)',
    badgeClassName:
      'bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20',
  },
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
  ...props
}) {
  const gradientId = useId().replace(/:/g, '');
  const variantConfig = variant ? VARIANT_CONFIG[variant] : undefined;
  const resolvedColor = color ?? variantConfig?.color ?? 'var(--primary)';
  const displayValue =
    value ?? (amount !== undefined ? formatCurrency(amount) : formatCurrency(0));

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
        'col-span-2 flex flex-col max-lg:col-span-full *:data-[slot=card-content]:lg:max-xl:flex-col *:data-[slot=card-content]:lg:max-xl:pr-6',
        className
      )}
      {...props}
    >
      <CardContent className="flex flex-1 items-center justify-between gap-4 pr-0">
        <div className="flex shrink-0 flex-col justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">{title}</span>
            <span className="text-3xl font-semibold">{displayValue}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={cn(
                'bg-primary/10 text-primary hover:bg-primary/20 h-6 rounded-sm px-3 py-1',
                variantConfig?.badgeClassName
              )}
            >
              {badge}
            </Badge>
            <span className="text-muted-foreground text-sm">{comparison}</span>
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-video max-h-26.5 w-full max-w-70 flex-1 max-sm:max-w-35"
        >
          <AreaChart
            data={normalizedData}
            margin={{ top: 4, right: 0, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`fill-${gradientId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="10%" stopColor={resolvedColor} stopOpacity={1} />
                <stop offset="90%" stopColor={resolvedColor} stopOpacity={0} />
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
              fillOpacity={0.6}
              stroke={resolvedColor}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default MetricAreaCard;
