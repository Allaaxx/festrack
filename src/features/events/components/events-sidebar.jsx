import { isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GlobeIcon, PlusIcon, ShareIcon } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const mockDots = [
  { date: '2026-08-30', colors: ['bg-violet-400'] },
  { date: '2026-09-01', colors: ['bg-violet-400'] },
  { date: '2026-09-02', colors: ['bg-violet-400', 'bg-violet-400'] },
  {
    date: '2026-09-03',
    colors: ['bg-violet-400', 'bg-violet-400'],
    moreCount: 1,
  },
  { date: '2026-09-04', colors: ['bg-amber-400'] },
  { date: '2026-09-05', colors: ['bg-violet-400'] },
  { date: '2026-09-06', colors: ['bg-rose-400', 'bg-amber-400'] },
  { date: '2026-09-07', colors: ['bg-violet-400'] },
  { date: '2026-09-09', colors: ['bg-violet-400', 'bg-violet-400'] },
  { date: '2026-09-10', colors: ['bg-rose-400'] },
  { date: '2026-09-11', colors: ['bg-violet-400'] },
  { date: '2026-09-12', colors: ['bg-amber-400', 'bg-sky-400'] },
  { date: '2026-09-14', colors: ['bg-emerald-400'] },
  { date: '2026-09-15', colors: ['bg-emerald-400'] },
  { date: '2026-09-16', colors: ['bg-emerald-400'] },
  { date: '2026-09-17', colors: ['bg-emerald-400', 'bg-violet-400'] },
  { date: '2026-09-18', colors: ['bg-rose-400'] },
  { date: '2026-09-19', colors: ['bg-violet-400', 'bg-violet-400'] },
  { date: '2026-09-21', colors: ['bg-amber-400'] },
  { date: '2026-09-23', colors: ['bg-violet-400', 'bg-emerald-400'] },
  { date: '2026-09-26', colors: ['bg-rose-400'] },
  { date: '2026-09-28', colors: ['bg-sky-400'] },
  { date: '2026-10-01', colors: ['bg-violet-400'] },
  { date: '2026-10-02', colors: ['bg-violet-400', 'bg-violet-400'] },
  {
    date: '2026-10-03',
    colors: ['bg-violet-400', 'bg-violet-400'],
    moreCount: 1,
  },
];

const mockEvents = [
  {
    id: 1,
    title: 'Weekend Hike',
    time: 'O dia todo',
    categoryColor: 'bg-yellow-500',
    avatar: 'https://github.com/shadcn.png',
  },
  {
    id: 2,
    title: 'Quarterly Budget Review',
    time: '10:00 - 11:30',
    categoryColor: 'bg-purple-500',
    avatar: 'https://github.com/shadcn.png',
  },
  {
    id: 3,
    title: 'Code Freeze',
    time: 'O dia todo',
    categoryColor: 'bg-blue-500',
    avatar: 'https://github.com/shadcn.png',
  },
  {
    id: 4,
    title: 'Team Lunch',
    time: '12:00 - 13:00',
    categoryColor: 'bg-green-500',
    avatar: 'https://github.com/shadcn.png',
  },
  {
    id: 5,
    title: 'Client Meeting',
    time: '14:00 - 15:00',
    categoryColor: 'bg-red-500',
    avatar: 'https://github.com/shadcn.png',
  },
  {
    id: 6,
    title: 'Project Kickoff',
    time: '16:00 - 17:00',
    categoryColor: 'bg-yellow-500',
    avatar: 'https://github.com/shadcn.png',
  },
];

export default function EventsSidebar() {
  const [date, setDate] = useState(new Date(2026, 8, 24)); // 24 de Setembro de 2026

  return (
    <div className="bg-muted hidden w-72 shrink-0 flex-col border-l lg:flex xl:w-80">
      <div className="flex h-full flex-col">
        {/* Mini Calendar */}
        <div className="border-b">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
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
                const dotData = mockDots.find((d) =>
                  isSameDay(parseISO(d.date), day.date)
                );

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
            {mockEvents.length}
          </span>
        </div>
        <p className="text-muted-foreground/70 px-4 pb-2 text-[11px]">
          Setembro 2026
        </p>

        {/* UP NEXT List */}
        <ScrollArea className="relative min-h-0 flex-1 px-4">
          <div className="flex flex-col gap-2 pb-4">
            {mockEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                className="bg-background hover:border-primary/40 hover:bg-accent/40 flex w-full items-stretch gap-3 rounded-lg border p-3 text-left transition"
              >
                <span
                  className={cn(
                    'w-1 shrink-0 rounded-full',
                    event.categoryColor
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="text-muted-foreground text-xs">{event.time}</p>
                </div>
                <Avatar className="my-auto size-6 shrink-0">
                  <AvatarImage src={event.avatar} alt={event.title} />
                  <AvatarFallback>{event.title.charAt(0)}</AvatarFallback>
                </Avatar>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 border-t p-4">
          <Button className="w-full" size="default">
            <PlusIcon className="mr-2 size-4" />
            Novo Evento
          </Button>
          <Button variant="outline" className="w-full" size="default">
            <ShareIcon className="mr-2 size-4" />
            Compartilhar Disponibilidade
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
