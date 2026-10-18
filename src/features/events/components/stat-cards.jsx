import {
  BookMarked,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShoppingCart,
  TicketCheck,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { buildEventOperationalStats } from '@/features/events/helpers/event-financials';

const getIcon = (iconName) => {
  switch (iconName) {
    case 'TicketCheck':
      return <TicketCheck className="size-4.75" />;
    case 'ShoppingCart':
      return <ShoppingCart className="size-4.75" />;
    case 'DollarSign':
      return <DollarSign className="size-4.75" />;
    case 'BookMarked':
      return <BookMarked className="size-4.75" />;
    default:
      return null;
  }
};

/**
 * Quatro cards operacionais (KPIs) do evento:
 * Status / Prazo, Total de Transações, Ticket Médio de Despesa e Maior Despesa.
 *
 * @param {{
 *   event?: { startDate?: Date | string, endDate?: Date | string } | null,
 *   transactions?: Array<{ name?: string, type?: string, amount?: number | string }>,
 *   stats?: Array<{
 *     id: string,
 *     testId: string,
 *     icon: string,
 *     trend: string,
 *     trendUp: boolean,
 *     value: string,
 *     title: string,
 *     badge: string,
 *   }>,
 * }} props
 */
const StatCards = ({ event, transactions = [], stats }) => {
  const cards = stats ?? buildEventOperationalStats(event, transactions);

  return (
    <div
      data-testid="event-stat-cards"
      className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:col-span-2"
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          data-testid={card.testId}
          className="border-border bg-card flex flex-col justify-between rounded-xl border p-5 shadow-xs"
        >
          {/* Card Top: Icon & Trend */}
          <div className="flex items-center justify-between pb-4">
            <Avatar className="size-9.5 rounded-sm after:border-0">
              <AvatarFallback className="bg-primary/10 text-primary size-9.5 shrink-0 rounded-sm text-sm">
                {getIcon(card.icon)}
              </AvatarFallback>
            </Avatar>

            <p className="text-foreground flex items-center gap-1 text-sm font-semibold">
              {card.trend}
              {card.trendUp ? (
                <ChevronUp className="size-4 text-emerald-500" />
              ) : (
                <ChevronDown className="size-4 text-rose-500" />
              )}
            </p>
          </div>

          {/* Card Body: Value & Title */}
          <div className="flex flex-1 flex-col justify-between gap-4">
            <p className="flex flex-col gap-1">
              <span className="text-foreground text-xl font-bold tracking-tight">
                {card.value}
              </span>
              <span className="text-muted-foreground text-sm">
                {card.title}
              </span>
            </p>

            {/* Timeframe / Detail Badge */}
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 w-fit max-w-full truncate rounded-md px-2.5 py-0.5 text-xs font-medium">
              {card.badge}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StatCards;
