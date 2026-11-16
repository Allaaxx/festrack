import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

import { KpiCard } from '@/components/shared/kpi-card';
import { formatCurrency, formatPercentage } from '@/helpers/currency';

export { formatPercentage };

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
      <KpiCard
        testId="kpi-card-revenue"
        title="Receita Total"
        value={formatCurrency(earnings)}
        badgeIcon={
          earningsPercentage >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />
        }
        badgeText={formatPercentage(earningsPercentage)}
        footerTitle={
          earningsPercentage >= 0 ? 'Crescimento este mês' : 'Redução este mês'
        }
        footerIcon={
          earningsPercentage >= 0 ? (
            <TrendingUpIcon className="size-4" />
          ) : (
            <TrendingDownIcon className="size-4" />
          )
        }
        footerSubtitle="Comparado aos últimos 6 meses"
        isLoading={isLoading}
      />

      {/* 2. Despesas do Mês */}
      <KpiCard
        testId="kpi-card-expenses"
        title="Despesas do Mês"
        value={formatCurrency(expenses)}
        badgeIcon={
          expensePercentage >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />
        }
        badgeText={formatPercentage(expensePercentage)}
        footerTitle={
          expensePercentage <= 0
            ? expensePercentage !== 0
              ? `Redução de ${Math.abs(expensePercentage)}% no período`
              : 'Sem alteração no período'
            : `Aumento de ${expensePercentage}% no período`
        }
        footerIcon={
          expensePercentage <= 0 ? (
            <TrendingDownIcon className="size-4" />
          ) : (
            <TrendingUpIcon className="size-4" />
          )
        }
        footerSubtitle="Controle de gastos dentro da meta"
        isLoading={isLoading}
      />

      {/* 3. Investimentos Ativos */}
      <KpiCard
        testId="kpi-card-investments"
        title="Investimentos Ativos"
        value={formatCurrency(investments)}
        badgeIcon={
          investmentsPercentage >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />
        }
        badgeText={formatPercentage(investmentsPercentage)}
        footerTitle="Rendimento acumulado"
        footerIcon={
          investmentsPercentage >= 0 ? (
            <TrendingUpIcon className="size-4" />
          ) : (
            <TrendingDownIcon className="size-4" />
          )
        }
        footerSubtitle="Alocação diversificada"
        isLoading={isLoading}
      />

      {/* 4. Saldo Geral */}
      <KpiCard
        testId="kpi-card-balance"
        title="Saldo Geral"
        value={formatCurrency(netBalance)}
        badgeIcon={netMargin >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
        badgeText={formatPercentage(netMargin)}
        footerTitle={
          netMargin >= 0
            ? 'Balanço financeiro positivo'
            : 'Balanço financeiro negativo'
        }
        footerIcon={
          netMargin >= 0 ? (
            <TrendingUpIcon className="size-4" />
          ) : (
            <TrendingDownIcon className="size-4" />
          )
        }
        footerSubtitle="Conforme projeção mensal"
        isLoading={isLoading}
      />
    </div>
  );
};

export default SectionCards;
