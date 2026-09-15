'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Label, Pie, PieChart, Sector } from 'recharts';

import { useGetTransactions } from '@/api/hooks/transaction';
import {
  Card,
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
import { Skeleton } from '@/components/ui/skeleton';

export const description = 'A donut chart';

const transactionTypeConfig = {
  EARNING: {
    label: 'Ganhos',
    fill: 'var(--primary-green)',
  },
  EXPENSE: {
    label: 'Gastos',
    fill: 'var(--primary-red)',
  },
  INVESTMENT: {
    label: 'Investimentos',
    fill: 'var(--primary-blue)',
  },
};

const chartConfig = {
  EARNING: {
    label: 'Ganhos',
    color: 'var(--primary-green)',
  },
  EXPENSE: {
    label: 'Gastos',
    color: 'var(--primary-red)',
  },
  INVESTMENT: {
    label: 'Investimentos',
    color: 'var(--primary-blue)',
  },
};

const renderSector = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, payload } =
    props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={payload.fill}
    />
  );
};

const calculateChartData = (transactions = []) => {
  const groupedTransactions = {
    EARNING: 0,
    EXPENSE: 0,
    INVESTMENT: 0,
  };

  for (const transaction of transactions) {
    const type = transaction.type;
    const amount = Number(transaction.amount);

    if (!transactionTypeConfig[type]) {
      continue;
    }

    if (!Number.isFinite(amount)) {
      continue;
    }

    groupedTransactions[type] += Math.abs(amount);
  }

  const totalAmount = Object.values(groupedTransactions).reduce(
    (total, amount) => total + amount,
    0
  );

  const data = Object.entries(groupedTransactions).map(([type, quantity]) => ({
    type,
    label: transactionTypeConfig[type].label,
    quantity,
    percentage:
      totalAmount > 0 ? Math.round((quantity / totalAmount) * 100) : 0,
    fill: transactionTypeConfig[type].fill,
  }));

  return { data };
};

const formatPeriodLabel = (from, to) => {
  if (from && to) {
    const fromLabel = format(new Date(`${from}T00:00:00`), 'MMMM yyyy', {
      locale: ptBR,
    }).replace(/^./, (char) => char.toUpperCase());
    const toLabel = format(new Date(`${to}T00:00:00`), 'MMMM yyyy', {
      locale: ptBR,
    }).replace(/^./, (char) => char.toUpperCase());
    return `${fromLabel} - ${toLabel}`;
  }
  if (from) {
    return `A partir de ${format(new Date(`${from}T00:00:00`), 'MMMM yyyy', { locale: ptBR }).replace(/^./, (char) => char.toUpperCase())}`;
  }
  if (to) {
    return `Até ${format(new Date(`${to}T00:00:00`), 'MMMM yyyy', { locale: ptBR }).replace(/^./, (char) => char.toUpperCase())}`;
  }
  return 'Todos os períodos';
};

export function TransactionsTypeChart() {
  const [searchParams] = useSearchParams();

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const { data: transactions, isLoading } = useGetTransactions({ from, to });

  const { data: chartData } = useMemo(() => {
    return calculateChartData(transactions);
  }, [transactions]);

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-6">
          <Skeleton className="aspect-square h-52 w-52 rounded-full sm:h-60 sm:w-60" />
        </CardContent>
      </Card>
    );
  }

  if (!transactions?.length) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-6">
          <p className="text-muted-foreground text-sm">
            Sem transações no período
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Transações</CardTitle>
        <CardDescription>{formatPeriodLabel(from, to)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 justify-between pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-52 w-full max-w-52 sm:h-60 sm:max-w-60"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="quantity"
              nameKey="label"
              innerRadius={60}
              shape={renderSector}
            >
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
                          y={viewBox.cy}
                          className="fill-foreground text-sm font-bold"
                        >
                          Transações
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {transactions.length}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
