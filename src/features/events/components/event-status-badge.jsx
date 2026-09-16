import { cva } from 'class-variance-authority';
import { CircleIcon } from 'lucide-react';

import {
  getEventStatus,
  getEventStatusLabel,
} from '@/features/events/helpers/event';

const badgeVariants = cva(
  'bg-muted flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold',
  {
    variants: {
      status: {
        scheduled: 'text-primary fill-primary',
        in_progress: 'text-green-500 fill-green-500',
        completed: 'text-muted-foreground fill-muted-foreground',
      },
    },
  }
);

/**
 * Badge de status temporal de um evento.
 *
 * @param {{ event: { startDate: string | Date, endDate: string | Date } }} props
 */
const EventStatusBadge = ({ event }) => {
  const status = getEventStatus(event);
  const label = getEventStatusLabel(status);

  return (
    <div className={badgeVariants({ status })}>
      <CircleIcon size={10} className="fill-inherit" />
      {label}
    </div>
  );
};

export default EventStatusBadge;
