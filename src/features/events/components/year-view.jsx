import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EventItem } from '@/features/events/components/event-item';
import { cn } from '@/lib/utils';

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

const STATUS_DOT_COLORS = {
  scheduled: 'bg-violet-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-rose-500',
};

const TAG_DOT_COLORS = {
  family: 'bg-amber-400',
  business: 'bg-violet-400',
  personal: 'bg-rose-400',
  holiday: 'bg-emerald-400',
  etc: 'bg-sky-400',
};

function getEventDotBg(ev) {
  if (ev.color && STATUS_DOT_COLORS[ev.color]) {
    return STATUS_DOT_COLORS[ev.color];
  }
  const tag = ev.tag || ev.event;
  if (tag && TAG_DOT_COLORS[tag]) {
    return TAG_DOT_COLORS[tag];
  }
  return 'bg-sky-400';
}

function MiniMonth({ monthDate, events = [], onDayClick }) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Map events for this month (supporting multi-day spans)
  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      const start = new Date(ev.start);
      const end = ev.end ? new Date(ev.end) : start;
      const validStart = start <= end ? start : end;
      const validEnd = start <= end ? end : start;
      const spanDays = eachDayOfInterval({ start: validStart, end: validEnd });
      spanDays.forEach((d) => {
        const dayKey = format(d, 'yyyy-MM-dd');
        if (!map.has(dayKey)) map.set(dayKey, []);
        map.get(dayKey).push(ev);
      });
    });
    return map;
  }, [events]);

  return (
    <div className="bg-card border-border rounded-lg border p-3 shadow-xs">
      <h3 className="text-foreground mb-2 text-center text-sm font-semibold">
        {capitalize(format(monthDate, 'MMMM', { locale: ptBR }))}
      </h3>

      <div className="text-muted-foreground mb-1 grid grid-cols-7 text-center text-[10px]">
        {weekdays.map((wd, i) => (
          <div key={i} className="py-0.5">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const isCurMonth = isSameMonth(day, monthDate);
          const isDayToday = isToday(day);
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(dayKey) || [];

          return (
            <div key={day.toISOString()} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => isCurMonth && onDayClick?.(day, dayEvents)}
                disabled={!isCurMonth}
                className={cn(
                  'flex size-7 cursor-pointer flex-col items-center justify-center rounded-md text-xs font-normal transition-colors',
                  !isCurMonth &&
                    'text-muted-foreground/30 pointer-events-none cursor-default',
                  isCurMonth && 'text-foreground hover:bg-accent',
                  isDayToday &&
                    'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold'
                )}
              >
                <span className="text-[11px] leading-none">
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && isCurMonth && (
                  <span className="mt-0.5 flex min-h-1 w-full items-center justify-center gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev, i) => {
                      const dotBg = getEventDotBg(ev);
                      return (
                        <span
                          key={i}
                          className={cn(
                            'size-1 shrink-0 rounded-full',
                            isDayToday ? 'bg-white' : dotBg
                          )}
                        />
                      );
                    })}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function YearView({
  currentDate,
  events = [],
  onEventSelect,
  onEventCreate,
}) {
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  const year = currentDate.getFullYear();
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  }, [year]);

  const handleDayClick = (day, dayEvents) => {
    setSelectedDayInfo({ day, events: dayEvents });
  };

  return (
    <div className="flex flex-col lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <ScrollArea className="lg:h-full">
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((monthDate, idx) => (
            <MiniMonth
              key={idx}
              monthDate={monthDate}
              events={events}
              onDayClick={handleDayClick}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Day Events Dialog */}
      <Dialog
        open={Boolean(selectedDayInfo)}
        onOpenChange={(open) => !open && setSelectedDayInfo(null)}
      >
        <DialogContent className="max-w-sm p-4" showCloseButton={false}>
          <div className="flex items-start justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="mt-0.5 size-2 shrink-0 rounded-full bg-rose-500" />
              <DialogTitle className="text-sm leading-snug font-semibold">
                Eventos em{' '}
                {selectedDayInfo &&
                  capitalize(
                    format(selectedDayInfo.day, "EEEE, d 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })
                  )}
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setSelectedDayInfo(null)}
              aria-label="Fechar"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto py-3">
            {selectedDayInfo?.events.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground mb-3 text-sm">
                  Nenhum evento planejado
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    const d = selectedDayInfo.day;
                    setSelectedDayInfo(null);
                    onEventCreate?.(d);
                  }}
                >
                  Criar evento
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {selectedDayInfo?.events.map((ev) => (
                    <EventItem
                      key={ev.id}
                      event={ev}
                      view="month"
                      onClick={(clicked) => {
                        setSelectedDayInfo(null);
                        onEventSelect?.(clicked);
                      }}
                    />
                  ))}
                </div>
                <div className="border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const d = selectedDayInfo.day;
                      setSelectedDayInfo(null);
                      onEventCreate?.(d);
                    }}
                  >
                    Criar evento
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default YearView;
