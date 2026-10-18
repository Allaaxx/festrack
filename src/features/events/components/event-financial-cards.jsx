import { WalletIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import MetricAreaCard from '@/features/events/components/metric-area-card';
import { buildEventMetricCardsData } from '@/features/events/helpers/event-financials';
import { BalanceItem, useGetTransactions } from '@/features/finances';

/**
 * Cards de métricas financeiras (KPIs) para a página de detalhes do evento.
 * Exibe os três MetricAreaCards (Total de Receitas, Total de Despesas, Total de Investimentos)
 * com gráficos de área cronológicos e o indicador de Saldo Líquido.
 *
 * @param {{
 *   eventId: string,
 *   transactions?: Array<any>,
 *   isLoading?: boolean,
 *   hideNetBalance?: boolean,
 * }} props
 */
const EventFinancialCards = ({
  eventId,
  transactions: propTransactions,
  isLoading: propIsLoading,
  hideNetBalance = false,
}) => {
  const query = useGetTransactions({ eventId });
  const transactions = propTransactions ?? query.data ?? [];
  const isLoading = propIsLoading ?? query.isLoading;

  if (isLoading) {
    return (
      <div
        data-testid="event-financial-cards-skeleton"
        className="grid grid-cols-1 gap-6 lg:grid-cols-6"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="col-span-2 h-32 rounded-xl max-lg:col-span-full"
          />
        ))}
        {!hideNetBalance && (
          <Skeleton className="col-span-full h-28 rounded-xl" />
        )}
      </div>
    );
  }

  const { totals, cards } = buildEventMetricCardsData(transactions);

  return (
    <div
      data-testid="event-financial-cards"
      className="grid grid-cols-1 gap-6 lg:grid-cols-6"
    >
      {cards.map((card) => (
        <MetricAreaCard
          key={card.id}
          data-testid={card.testId}
          title={card.title}
          value={card.value}
          badge={card.badge}
          comparison={card.comparison}
          variant={card.variant}
          data={card.data}
        />
      ))}

      {!hideNetBalance && (
        <BalanceItem
          data-testid="kpi-net-balance"
          className="col-span-full"
          label="Saldo Líquido"
          amount={totals.netBalance}
          icon={<WalletIcon size={16} />}
        />
      )}
    </div>
  );
};

export default EventFinancialCards;

