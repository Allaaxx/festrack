import {
  addDays,
  endOfDay,
  format,
  isSameDay,
  isToday,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarX2 } from 'lucide-react';
import { useMemo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { EventItem } from '@/features/events/components/event-item';
import { cn } from '@/lib/utils';

export function AgendaView({ currentDate, events = [], onEventSelect }) {
  const AGENDA_DAYS = 30;

  const daysList = useMemo(() => {
    return Array.from({ length: AGENDA_DAYS }, (_, i) =>
      addDays(new Date(currentDate), i)
    );
  }, [currentDate]);

  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups = [];

    daysList.forEach((day) => {
      const startDay = startOfDay(day);
      const endDay = endOfDay(day);

      const dayEvents = events.filter((ev) => {
        const s = new Date(ev.start);
        const e = new Date(ev.end || ev.start);
        if (s.getTime() === e.getTime()) {
          return isSameDay(day, s);
        }
        return s < endDay && e > startDay;
      });

      if (dayEvents.length > 0) {
        groups.push({
          day,
          events: dayEvents.sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          ),
        });
      }
    });

    return groups;
  }, [daysList, events]);

  return (
    <div
      data-slot="agenda-view"
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <ScrollArea className="h-full flex-1">
        <div className="mx-auto w-full p-4 sm:p-6">
          {groupedEvents.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
              <CalendarX2 className="text-muted-foreground/40 mb-3 size-10" />
              <h3 className="text-foreground text-lg font-medium">
                Nenhum evento encontrado
              </h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                Não há eventos agendados para este período.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedEvents.map(({ day, events: dayEvents }) => {
                const isDayToday = isToday(day);
                return (
                  <div key={day.toISOString()} className="relative">
                    {/* Date separator label */}
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={cn(
                          'text-xs font-semibold tracking-wider uppercase',
                          isDayToday ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {format(day, "d 'de' MMMM, EEEE", { locale: ptBR })}
                      </span>
                      {isDayToday && (
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                          Hoje
                        </span>
                      )}
                      <div className="bg-border/70 h-px flex-1" />
                    </div>

                    {/* Events list */}
                    <div className="space-y-2 pl-1 sm:pl-2">
                      {dayEvents.map((ev) => (
                        <EventItem
                          key={ev.id}
                          event={ev}
                          view="agenda"
                          onClick={() => onEventSelect?.(ev)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default AgendaView;
