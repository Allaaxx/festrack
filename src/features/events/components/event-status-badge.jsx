import { CircleIcon } from 'lucide-react';

import {
  EVENT_STATUSES,
  getEventStatus,
} from '@/features/events/helpers/event';
import { cn } from '@/lib/utils';

/**
 * Badge de status temporal de um evento.
 *
 * @param {{ event: { startDate: string | Date, endDate: string | Date } }} props
 */
const EventStatusBadge = ({ event }) => {
  const status = getEventStatus(event);
  const statusConfig = EVENT_STATUSES[status];

  if (!statusConfig) return null;

  return (
    <div
      className={cn(
        'bg-muted flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold',
        statusConfig.badgeClass
      )}
    >
      <CircleIcon size={10} className="fill-inherit" />
      {statusConfig.label}
    </div>
  );
};

export default EventStatusBadge;
