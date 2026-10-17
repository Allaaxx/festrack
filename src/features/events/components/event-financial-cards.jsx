import {
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { calculateEventFinancialTotals } from '@/features/events/helpers/event-financials';
import { BalanceItem, useGetTransactions } from '@/features/finances';

/**
 * Cards de métricas financeiras (KPIs) para a página de detalhes do evento.
 * Exibe Total de Receitas, Total de Despesas, Total de Investimentos e Saldo Líquido.
 *
 * @param {{
 *   eventId: string,
 *   transactions?: Array<any>,
 *   isLoading?: boolean,
 * }} props
 */
const EventFinancialCards = ({
  eventId,
  transactions: propTransactions,
  isLoading: propIsLoading,
}) => {
  const query = useGetTransactions({ eventId });
  const transactions = propTransactions ?? query.data ?? [];
  const isLoading = propIsLoading ?? query.isLoading;

  if (isLoading) {
    return (
      <div
        data-testid="event-financial-cards-skeleton"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const totals = calculateEventFinancialTotals(transactions);

  return (
    <div
      data-testid="event-financial-cards"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <BalanceItem
        data-testid="kpi-earnings"
        label="Total de Receitas"
        amount={totals.earnings}
        icon={<TrendingUpIcon size={16} className="text-primary-green" />}
      />
      <BalanceItem
        data-testid="kpi-expenses"
        label="Total de Despesas"
        amount={totals.expenses}
        icon={<TrendingDownIcon size={16} className="text-primary-red" />}
      />
      <BalanceItem
        data-testid="kpi-investments"
        label="Total de Investimentos"
        amount={totals.investments}
        icon={<PiggyBankIcon size={16} className="text-primary-blue" />}
      />
      <BalanceItem
        data-testid="kpi-net-balance"
        label="Saldo Líquido"
        amount={totals.netBalance}
        icon={<WalletIcon size={16} />}
      />
    </div>
  );
};

export default EventFinancialCards;
