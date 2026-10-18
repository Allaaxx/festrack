import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  PencilIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import DeleteEventButton from '@/features/events/components/delete-event-button';
import EditEventSheet from '@/features/events/components/edit-event-sheet';
import EventStatusBadge from '@/features/events/components/event-status-badge';
import {
  formatEventDate,
  formatEventDateRange,
  parseEventDate,
} from '@/features/events/helpers/event';
import { AddTransactionButton } from '@/features/finances';
import { formatCurrency } from '@/helpers/currency';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
];

/**
 * Extrai dia e mês abreviado em maiúsculas a partir da data de início do evento.
 *
 * @param {string | Date | null | undefined} dateValue
 * @returns {{ day: string, month: string }}
 */
const getDayAndMonth = (dateValue) => {
  const parsed = parseEventDate(dateValue);
  if (parsed) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[parsed.getMonth()] ?? 'OUT';
    return { day, month };
  }

  // Fallback para strings formatadas dd/MM/yyyy
  if (typeof dateValue === 'string' && dateValue.includes('/')) {
    const [day = '01', monthNum = '10'] = dateValue.split('/');
    const month = MONTH_NAMES[parseInt(monthNum, 10) - 1] ?? 'OUT';
    return { day: day.padStart(2, '0'), month };
  }

  return { day: '01', month: 'OUT' };
};

/**
 * Cabeçalho do evento com layout em Card, bloco visual de data,
 * pílulas de metadados, descrição e botões de ação integrados.
 *
 * @param {{
 *   event: {
 *     id: string,
 *     name?: string,
 *     title?: string,
 *     description?: string | null,
 *     startDate: string | Date,
 *     endDate: string | Date,
 *     income?: string,
 *     expense?: string,
 *     balance?: string,
 *     transactionsCount?: number,
 *   },
 *   showFinancialSummary?: boolean,
 *   onDeleteSuccess?: () => void,
 *   className?: string,
 * }} props
 */
const EventDetailHeader = ({
  event,
  showFinancialSummary = false,
  onDeleteSuccess,
  className,
}) => {
  const eventName = event?.name ?? event?.title ?? '';
  const { day, month } = useMemo(
    () => getDayAndMonth(event?.startDate),
    [event?.startDate]
  );

  const isSameDay = useMemo(() => {
    if (!event?.startDate || !event?.endDate) return true;
    return formatEventDate(event.startDate) === formatEventDate(event.endDate);
  }, [event?.startDate, event?.endDate]);

  if (!event) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Navegação Superior */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link to="/events" />}
          className="text-muted-foreground hover:text-foreground -ml-2.5 gap-1.5"
        >
          <ArrowLeftIcon className="size-4" />
          <span>Voltar ao calendário</span>
        </Button>
      </div>

      {/* Card Principal do Evento */}
      <Card
        data-testid="event-header-card"
        className="border-border bg-card overflow-hidden rounded-xl border shadow-xs"
      >
        <CardContent className="p-0">
          {/* Seção Superior: Identificação do Evento + Botões de Ação */}
          <div className="flex flex-col justify-between gap-6 p-6 lg:flex-row lg:items-center">
            {/* Esquerda: Bloco de Data + Título + Metadados */}
            <div className="flex items-start gap-4 sm:items-center">
              {/* Bloco Visual do Dia */}
              <div
                data-testid="event-header-date-badge"
                className="border-border bg-primary/10 text-primary flex size-14 shrink-0 flex-col items-center justify-center rounded-lg border shadow-2xs"
              >
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">
                  {month}
                </span>
                <span className="text-foreground text-xl leading-none font-bold tracking-tight">
                  {day}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {/* Título e Badge de Status */}
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                    {eventName}
                  </h1>
                  <EventStatusBadge event={event} />
                </div>

                {/* Linha de Datas e Informações */}
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                  <div className="bg-muted/50 text-muted-foreground flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium">
                    <CalendarDaysIcon className="text-primary size-3.5" />
                    <span>
                      {formatEventDateRange(event.startDate, event.endDate)}
                    </span>
                  </div>

                  <div className="bg-muted/50 text-muted-foreground flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium">
                    <ClockIcon className="text-muted-foreground size-3.5" />
                    <span>{isSameDay ? 'Dia único' : 'Múltiplos dias'}</span>
                  </div>
                </div>

                {/* Descrição do Evento */}
                {event.description && (
                  <p className="text-muted-foreground max-w-2xl pt-0.5 text-sm">
                    {event.description}
                  </p>
                )}
              </div>
            </div>

            {/* Direita: Botões de Ação */}
            <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:flex-nowrap">
              <AddTransactionButton initialEventId={event.id} />

              <Separator
                orientation="vertical"
                className="mx-0.5 hidden h-6 sm:block"
              />

              <EditEventSheet
                event={event}
                onDeleteSuccess={onDeleteSuccess}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border bg-background/50 hover:bg-muted h-9 gap-1.5"
                  >
                    <PencilIcon className="text-muted-foreground size-3.5" />
                    <span>Editar</span>
                  </Button>
                }
              />

              <DeleteEventButton
                event={event}
                onSuccess={onDeleteSuccess}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 border-rose-500/20 bg-rose-500/5 text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2Icon className="size-3.5" />
                    <span>Excluir</span>
                  </Button>
                }
              />
            </div>
          </div>

          {/* Seção Inferior (Opcional): Resumo Financeiro Compacto */}
          {showFinancialSummary && (
            <div className="border-border bg-muted/20 divide-border grid grid-cols-1 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex items-center gap-3 px-6 py-3.5">
                <Avatar className="size-9 rounded-sm after:border-0">
                  <AvatarFallback className="bg-primary-green/10 text-primary-green size-9 shrink-0 rounded-sm">
                    <TrendingUpIcon className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">
                    Receitas do evento
                  </span>
                  <span className="text-foreground text-sm font-semibold">
                    {event.income ?? formatCurrency(0)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-3.5">
                <Avatar className="size-9 rounded-sm after:border-0">
                  <AvatarFallback className="bg-primary-red/10 text-primary-red size-9 shrink-0 rounded-sm">
                    <TrendingDownIcon className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">
                    Despesas do evento
                  </span>
                  <span className="text-foreground text-sm font-semibold">
                    {event.expense ?? formatCurrency(0)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 rounded-sm after:border-0">
                    <AvatarFallback className="bg-primary/10 text-primary size-9 shrink-0 rounded-sm">
                      <WalletIcon className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">
                      Balanço líquido
                    </span>
                    <span className="text-foreground text-sm font-semibold">
                      {event.balance ?? formatCurrency(0)}
                    </span>
                  </div>
                </div>

                {event.transactionsCount !== undefined && (
                  <Badge className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-medium">
                    {event.transactionsCount === 1
                      ? '1 transação'
                      : `${event.transactionsCount} transações`}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetailHeader;
