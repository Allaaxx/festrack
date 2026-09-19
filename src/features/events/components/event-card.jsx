import { CalendarIcon, ExternalLinkIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DeleteEventButton from '@/features/events/components/delete-event-button';
import EditEventSheet from '@/features/events/components/edit-event-sheet';
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
            <EditEventSheet
              event={event}
              trigger={
                <Button variant="ghost" size="icon">
                  <ExternalLinkIcon className="text-muted-foreground" />
                </Button>
              }
            />
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
