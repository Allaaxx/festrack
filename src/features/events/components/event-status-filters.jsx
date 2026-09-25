import { cn } from '@/lib/utils';

import { EVENT_STATUSES } from '../helpers/event';

export function EventStatusFilters({ selectedStatuses = [], onToggleStatus }) {
  const isAllSelected = selectedStatuses.length === 0;

  return (
    <div className="flex scrollbar-none items-center gap-3 overflow-x-auto border-t border-b px-2 py-2 sm:px-4">
      <span className="text-muted-foreground shrink-0 text-sm font-medium">
        Exibir:
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onToggleStatus('all')}
          className={cn(
            'flex cursor-pointer items-center rounded-full border px-3 py-1 text-xs font-medium transition-all',
            isAllSelected
              ? 'border-border bg-muted/50 text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 border-transparent opacity-50 hover:opacity-100'
          )}
        >
          Todos
        </button>
        {Object.values(EVENT_STATUSES).map((status) => {
          const isSelected = selectedStatuses.includes(status.key);
          const isDimmed = !isAllSelected && !isSelected;

          return (
            <button
              key={status.key}
              type="button"
              onClick={() => onToggleStatus(status.key)}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                status.filterClass,
                isDimmed && 'opacity-50'
              )}
            >
              <div className={cn('h-2 w-2 rounded-full', status.dotClass)} />
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EventStatusFilters;
