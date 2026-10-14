import {
  ArrowLeftIcon,
  CalendarIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import DeleteEventButton from '@/features/events/components/delete-event-button';
import EditEventSheet from '@/features/events/components/edit-event-sheet';
import EventStatusBadge from '@/features/events/components/event-status-badge';
import { formatEventDateRange } from '@/features/events/helpers/event';
import { AddTransactionButton } from '@/features/transactions';

/**
 * Cabeçalho detalhado do evento exibindo dados principais, navegação e botões de ação rápida.
 *
 * @param {{
 *   event: {
 *     id: string,
 *     name: string,
 *     description?: string | null,
 *     startDate: string | Date,
 *     endDate: string | Date,
 *   },
 *   onDeleteSuccess?: () => void,
 * }} props
 */
const EventDetailHeader = ({ event, onDeleteSuccess }) => {
  if (!event) return null;

  return (
    <div className="space-y-4">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link to="/event" />}
          className="text-muted-foreground hover:text-foreground -ml-2.5 gap-1.5"
        >
          <ArrowLeftIcon className="size-4" />
          Voltar ao calendário
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {event.name}
            </h1>
            <EventStatusBadge event={event} />
          </div>

          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <CalendarIcon className="size-4 shrink-0" />
            <span>{formatEventDateRange(event.startDate, event.endDate)}</span>
          </div>

          {event.description && (
            <p className="text-muted-foreground max-w-2xl pt-1 text-sm">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AddTransactionButton initialEventId={event.id} />
          <EditEventSheet
            event={event}
            onDeleteSuccess={onDeleteSuccess}
            trigger={
              <Button variant="outline">
                <PencilIcon className="size-4" />
                Editar
              </Button>
            }
          />
          <DeleteEventButton
            event={event}
            onSuccess={onDeleteSuccess}
            trigger={
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2Icon className="size-4" />
                Excluir
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default EventDetailHeader;
