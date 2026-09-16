import { CalendarIcon } from 'lucide-react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DeleteEventButton from '@/features/events/components/delete-event-button';
import EditEventButton from '@/features/events/components/edit-event-button';
import EventStatusBadge from '@/features/events/components/event-status-badge';
import { formatEventDateRange } from '@/features/events/helpers/event';

/**
 * Card de exibição de um evento individual.
 *
 * @param {{ event: { id: string, name: string, description: string | null, startDate: string, endDate: string } }} props
 */
const EventCard = ({ event }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
          <CardTitle className="truncate">{event.name}</CardTitle>
        </div>
        <CardAction>
          <div className="flex items-center">
            <EditEventButton event={event} />
            <DeleteEventButton event={event} />
          </div>
        </CardAction>
        {event.description && (
          <CardDescription className="line-clamp-2">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <p className="text-muted-foreground text-xs">
          {formatEventDateRange(event.startDate, event.endDate)}
        </p>
        <EventStatusBadge event={event} />
      </CardContent>
    </Card>
  );
};

export default EventCard;
