import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { buildEventBalanceOverviewData } from '@/features/events/helpers/event-financials';
import { formatCurrency } from '@/helpers/currency';
import { cn } from '@/lib/utils';

const barChartConfig = {
  entradas: {
    label: 'Entradas',
    color: 'var(--color-primary-green)',
  },
  saidas: {
    label: 'Saídas',
    color: 'var(--color-primary-red)',
  },
};

const pieChartConfig = {
  consumo: {
    label: 'Consumo',
    color: 'var(--primary)',
  },
};

/**
 * Card de visão geral financeira do evento ("Balanço do Evento"),
 * exibindo gráfico de barras comparativo (Entradas vs Saídas),
 * medidor circular de comprometimento e resumo de Saldo Líquido.
 *
 * @param {{
 *   transactions?: Array<any>,
 *   className?: string,
 * }} props
 */
export function TotalRevenueCard({ transactions = [], className, ...props }) {
  const {
    entradas,
    saidas,
    netBalance,
    executionPercentage,
    barData,
    pieData,
  } = buildEventBalanceOverviewData(transactions);

  return (
    <Card
      data-testid="event-balance-overview-card"
      className={cn(
        'col-span-full grid flex-col lg:grid-cols-5 2xl:col-span-4',
        className
      )}
      {...props}
    >
      {/* Lado Esquerdo: Gráfico de Barras Entradas vs Saídas */}
      <div className="flex flex-col gap-4 max-lg:border-b max-lg:pb-6 lg:col-span-3 lg:border-r">
        <CardHeader className="flex items-center justify-between">
          <span className="text-lg font-semibold">Balanço do Evento</span>
          <span className="text-muted-foreground text-xs">
            Entradas vs Saídas
          </span>
        </CardHeader>

        <CardContent className="flex-1 max-[475px]:mx-auto">
          <ChartContainer
            config={barChartConfig}
            className="h-full min-h-55 w-full max-[475px]:max-w-73 lg:min-h-75"
          >
            <BarChart
              data={barData}
              barSize={14}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="6"
                stroke="var(--border)"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis tickLine={false} axisLine={false} hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value) || 0)}
                  />
                }
              />
              <ChartLegend
                verticalAlign="top"
                align="left"
                content={
                  <ChartLegendContent className="justify-start px-6 pb-6 text-sm [&_div>div]:rounded-full" />
                }
              />
              <Bar
                dataKey="entradas"
                fill="var(--color-entradas)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="saidas"
                fill="var(--color-saidas)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </div>

      {/* Lado Direito: Saldo Líquido + Gauge Chart + Resumo de Entradas e Saídas */}
      <div className="flex flex-col justify-between gap-6 lg:col-span-2">
        <CardHeader className="lg:pl-0">
          <div
            data-testid="kpi-net-balance"
            className="border-border bg-muted/30 flex w-full items-center justify-between rounded-lg border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Wallet className="text-muted-foreground size-4" />
              <span className="text-muted-foreground text-sm">
                Saldo Líquido
              </span>
            </div>
            <span className="text-base font-semibold">
              {formatCurrency(netBalance)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 lg:pl-0">
          <div className="space-y-4 pt-2 text-center">
            <ChartContainer
              config={pieChartConfig}
              className="h-40 w-full sm:h-45"
            >
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="55%"
                  innerRadius={60}
                  outerRadius={85}
                  startAngle={0}
                  endAngle={225}
                  paddingAngle={4}
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 7}
                              className="fill-card-foreground text-2xl font-semibold"
                            >
                              {executionPercentage}%
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 14}
                              className="fill-muted-foreground text-sm"
                            >
                              Consumo
                            </tspan>
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <span className="text-muted-foreground block text-sm">
              {executionPercentage}% das entradas comprometidas
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 md:max-lg:gap-0">
            <div className="flex items-center gap-2 p-2">
              <Avatar size="lg" className="rounded-sm after:border-0">
                <AvatarFallback className="bg-primary-green/10 text-primary-green shrink-0 rounded-sm">
                  <ArrowUpRight className="size-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-sm">
                  Total de Entradas
                </span>
                <span className="text-base font-medium">
                  {formatCurrency(entradas)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2">
              <Avatar size="lg" className="rounded-sm after:border-0">
                <AvatarFallback className="bg-primary-red/10 text-primary-red shrink-0 rounded-sm">
                  <ArrowDownRight className="size-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-sm">
                  Total de Saídas
                </span>
                <span className="text-base font-medium">
                  {formatCurrency(saidas)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default TotalRevenueCard;
