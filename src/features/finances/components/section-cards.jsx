import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/helpers/currency';

/**
 * Formats a percentage number or string with a leading '+' if positive,
 * or returns '0%' when empty or zero.
 *
 * @param {number | string | null | undefined} value
 * @returns {string}
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  if (typeof value === 'string' && value.endsWith('%')) {
    const trimmed = value.slice(0, -1);
    const num = parseFloat(trimmed);
    if (Number.isNaN(num)) return value;
    if (num > 0 && !value.startsWith('+')) return `+${value}`;
    return value;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num) || num === 0) return '0%';
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1);
  return num > 0 ? `+${formatted}%` : `${formatted}%`;
};

/**
 * Financial summary KPI cards displaying Total Revenue, Period Expenses,
 * Active Investments, and Net Balance with real-time percentages and trend indicators.
 *
 * @param {{
 *   balance?: {
 *     earnings?: number,
 *     expenses?: number,
 *     investiments?: number,
 *     investments?: number,
 *     earningsPercentage?: number,
 *     expensePercentage?: number,
 *     investmentsPercentage?: number,
 *     balance?: number,
 *   } | null,
 *   isLoading?: boolean,
 * }} props
 */
export const SectionCards = ({ balance, isLoading = false }) => {
  const earnings = balance?.earnings ?? 0;
  const expenses = balance?.expenses ?? 0;
  const investments = balance?.investiments ?? balance?.investments ?? 0;
  const netBalance = balance?.balance ?? 0;

  const earningsPercentage = balance?.earningsPercentage ?? 0;
  const expensePercentage = balance?.expensePercentage ?? 0;
  const investmentsPercentage =
    balance?.investmentsPercentage ?? balance?.investimentsPercentage ?? 0;

  // net margin = (balance?.earnings > 0 ? (balance.balance / balance.earnings) * 100 : 0)
  const netMargin = earnings > 0 ? (netBalance / earnings) * 100 : 0;

  return (
    <div
      className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      aria-busy={isLoading}
    >
      {isLoading && (
        <span
          className="sr-only"
          role="status"
          aria-label="Carregando métricas financeiras..."
        >
          Carregando métricas financeiras...
        </span>
      )}

      {/* 1. Receita Total */}
      <Card data-testid="kpi-card-revenue" className="@container/card">
        <CardHeader>
          <CardDescription>Receita Total</CardDescription>
          {isLoading ? (
            <Skeleton
              data-testid="kpi-skeleton"
              aria-hidden="true"
              className="h-8 w-32"
            />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(earnings)}
            </CardTitle>
          )}
          <CardAction>
            {isLoading ? (
              <Skeleton
                data-testid="kpi-skeleton"
                aria-hidden="true"
                className="h-5 w-14 rounded-full"
              />
            ) : (
              <Badge variant="outline">
                {earningsPercentage >= 0 ? (
                  <TrendingUpIcon />
                ) : (
                  <TrendingDownIcon />
                )}
                {formatPercentage(earningsPercentage)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {earningsPercentage >= 0 ? (
              <>
                Crescimento este mês <TrendingUpIcon className="size-4" />
              </>
            ) : (
              <>
                Redução este mês <TrendingDownIcon className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            Comparado aos últimos 6 meses
          </div>
        </CardFooter>
      </Card>

      {/* 2. Despesas do Mês */}
      <Card data-testid="kpi-card-expenses" className="@container/card">
        <CardHeader>
          <CardDescription>Despesas do Mês</CardDescription>
          {isLoading ? (
            <Skeleton
              data-testid="kpi-skeleton"
              aria-hidden="true"
              className="h-8 w-32"
            />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(expenses)}
            </CardTitle>
          )}
          <CardAction>
            {isLoading ? (
              <Skeleton
                data-testid="kpi-skeleton"
                aria-hidden="true"
                className="h-5 w-14 rounded-full"
              />
            ) : (
              <Badge variant="outline">
                {expensePercentage >= 0 ? (
                  <TrendingUpIcon />
                ) : (
                  <TrendingDownIcon />
                )}
                {formatPercentage(expensePercentage)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {expensePercentage <= 0 ? (
              <>
                {expensePercentage !== 0
                  ? `Redução de ${Math.abs(expensePercentage)}% no período`
                  : 'Sem alteração no período'}{' '}
                <TrendingDownIcon className="size-4" />
              </>
            ) : (
              <>
                Aumento de {expensePercentage}% no período{' '}
                <TrendingUpIcon className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            Controle de gastos dentro da meta
          </div>
        </CardFooter>
      </Card>

      {/* 3. Investimentos Ativos */}
      <Card data-testid="kpi-card-investments" className="@container/card">
        <CardHeader>
          <CardDescription>Investimentos Ativos</CardDescription>
          {isLoading ? (
            <Skeleton
              data-testid="kpi-skeleton"
              aria-hidden="true"
              className="h-8 w-32"
            />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(investments)}
            </CardTitle>
          )}
          <CardAction>
            {isLoading ? (
              <Skeleton
                data-testid="kpi-skeleton"
                aria-hidden="true"
                className="h-5 w-14 rounded-full"
              />
            ) : (
              <Badge variant="outline">
                {investmentsPercentage >= 0 ? (
                  <TrendingUpIcon />
                ) : (
                  <TrendingDownIcon />
                )}
                {formatPercentage(investmentsPercentage)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Rendimento acumulado{' '}
            {investmentsPercentage >= 0 ? (
              <TrendingUpIcon className="size-4" />
            ) : (
              <TrendingDownIcon className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">Alocação diversificada</div>
        </CardFooter>
      </Card>

      {/* 4. Saldo Geral */}
      <Card data-testid="kpi-card-balance" className="@container/card">
        <CardHeader>
          <CardDescription>Saldo Geral</CardDescription>
          {isLoading ? (
            <Skeleton
              data-testid="kpi-skeleton"
              aria-hidden="true"
              className="h-8 w-32"
            />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(netBalance)}
            </CardTitle>
          )}
          <CardAction>
            {isLoading ? (
              <Skeleton
                data-testid="kpi-skeleton"
                aria-hidden="true"
                className="h-5 w-14 rounded-full"
              />
            ) : (
              <Badge variant="outline">
                {netMargin >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                {formatPercentage(netMargin)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {netMargin >= 0 ? (
              <>
                Balanço financeiro positivo <TrendingUpIcon className="size-4" />
              </>
            ) : (
              <>
                Balanço financeiro negativo <TrendingDownIcon className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">Conforme projeção mensal</div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SectionCards;
