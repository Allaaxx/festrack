import { Skeleton } from '@/components/ui/skeleton';
import MetricAreaCard from '@/features/events/components/metric-area-card';
import StatCards from '@/features/events/components/stat-cards';
import TotalRevenueCard from '@/features/events/components/total-revenue-card';
import { buildEventMetricCardsData } from '@/features/events/helpers/event-financials';
import { useGetTransactions } from '@/features/finances';

/**
 * Cards de métricas financeiras e operacionais (KPIs) para a página de detalhes do evento.
 * Exibe os StatCards operacionais, o Balanço do Evento (Entradas vs Saídas, medidor de consumo
 * e Saldo Líquido) e os três MetricAreaCards (Total de Receitas, Total de Despesas, Total de Investimentos).
 *
 * @param {{
 *   eventId: string,
 *   event?: { startDate?: Date | string, endDate?: Date | string } | null,
 *   transactions?: Array<any>,
 *   isLoading?: boolean,
 *   hideNetBalance?: boolean,
 * }} props
 */
const EventFinancialCards = ({
  eventId,
  event,
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
        {event && (
          <Skeleton className="col-span-full h-72 rounded-xl xl:col-span-2" />
        )}
        {!hideNetBalance && (
          <Skeleton className="col-span-full h-72 rounded-xl 2xl:col-span-4" />
        )}
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="col-span-2 h-32 rounded-xl max-lg:col-span-full"
          />
        ))}
      </div>
    );
  }

  const { cards } = buildEventMetricCardsData(transactions);

  return (
    <div
      data-testid="event-financial-cards"
      className="grid grid-cols-1 gap-6 lg:grid-cols-6"
    >
      {event && <StatCards event={event} transactions={transactions} />}
      {!hideNetBalance && <TotalRevenueCard transactions={transactions} />}

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
    </div>
  );
};

export default EventFinancialCards;
