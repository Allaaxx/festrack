import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GlobeIcon, PlusIcon } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { useEventsSidebar } from '../hooks/use-events-sidebar';

export default function EventsSidebar({
  currentDate,
  onDateChange,
  events = [],
  onEventCreate,
}) {
  const {
    dotsByDate,
    upcomingEvents,
    currentMonthYear,
    handleDateSelect,
    handleEventClick,
    getDotColorClass,
    getEventInitials,
  } = useEventsSidebar({ events, onDateChange });

  return (
    <div className="bg-muted hidden w-72 shrink-0 flex-col border-l lg:flex xl:w-80">
      <div className="flex h-full flex-col">
        {/* Mini Calendar */}
        <div className="border-b">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleDateSelect}
            locale={ptBR}
            className="cn-calendar group/calendar bg-muted w-full p-2 [--cell-size:--spacing(8)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent rtl:**:[.rdp-button_next>svg]:rotate-180 rtl:**:[.rdp-button_previous>svg]:rotate-180"
            classNames={{
              month_grid: 'w-full border-collapse rdp-month_grid',
              weekdays: 'flex w-full',
              weekday:
                'flex-1 min-w-0 text-center text-[0.8rem] font-normal text-muted-foreground select-none',
              week: 'mt-1 flex w-full',
              day: 'group/day relative flex min-w-0 flex-1 basis-0 flex-col items-stretch p-0 text-center select-none',
              outside:
                'text-muted-foreground aria-selected:text-muted-foreground rdp-outside',
            }}
            components={{
              DayButton: ({ day, modifiers, className, ...props }) => {
                const dateKey = format(day.date, 'yyyy-MM-dd');
                const dotData = dotsByDate.get(dateKey);

                return (
                  <CalendarDayButton
                    day={day}
                    modifiers={modifiers}
                    className={cn(
                      'hover:bg-primary/20 dark:hover:bg-primary/20 text-muted-foreground data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:bg-primary! size-auto! h-auto! w-full min-w-0 justify-between gap-0.5 rounded-xl px-0 py-2 group-data-[focused=true]/day:ring-0 [&>span]:opacity-100',
                      className
                    )}
                    {...props}
                  >
                    <span className="text-xs leading-none">
                      {day.date.getDate()}
                    </span>
                    <span className="mt-0.5 flex min-h-2 w-full max-w-full items-center justify-center gap-px overflow-hidden">
                      {dotData?.colors.map((color, index) => (
                        <span
                          key={index}
                          className={cn('size-1 shrink-0 rounded-full', color)}
                          aria-hidden="true"
                        />
                      ))}
                      {dotData?.moreCount > 0 && (
                        <span className="text-[9px] leading-none font-medium">
                          +{dotData.moreCount}
                        </span>
                      )}
                    </span>
                  </CalendarDayButton>
                );
              },
            }}
          />
        </div>

        {/* UP NEXT Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0.5">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            A seguir
          </span>
          <span className="bg-secondary text-secondary-foreground inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-full px-2 text-xs font-medium whitespace-nowrap">
            {upcomingEvents.length}
          </span>
        </div>
        <p className="text-muted-foreground/70 px-4 pb-2 text-[11px] capitalize">
          {currentMonthYear}
        </p>

        {/* UP NEXT List */}
        <ScrollArea className="relative min-h-0 flex-1 px-4">
          <div className="flex flex-col gap-2 pb-4">
            {upcomingEvents.map((event) => {
              const dotColor = getDotColorClass(event.color);
              const eventTime = event.allDay
                ? 'O dia todo'
                : `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`;

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleEventClick(event)}
                  className="bg-background hover:border-primary/40 hover:bg-accent/40 flex w-full items-stretch gap-3 rounded-lg border p-3 text-left transition"
                >
                  <span
                    className={cn('w-1 shrink-0 rounded-full', dotColor)}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="truncate text-sm font-medium">
                      {event.title}
                    </p>
                    <p className="text-muted-foreground text-xs">{eventTime}</p>
                  </div>
                  <Avatar className="my-auto size-6 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {getEventInitials(event.title)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              );
            })}
            {upcomingEvents.length === 0 && (
              <div className="text-muted-foreground py-8 text-center text-sm">
                Nenhum evento futuro
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 border-t p-4">
          <Button className="w-full" size="default" onClick={onEventCreate}>
            <PlusIcon className="mr-2 size-4" />
            Novo Evento
          </Button>
        </div>

        {/* Timezone Footer */}
        <div className="flex items-center gap-2 border-t p-4">
          <GlobeIcon className="text-muted-foreground size-3.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
              Seu fuso horário
            </p>
            <p className="truncate text-xs font-medium">
              GMT-3 (-03:00) · America/Sao_Paulo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
