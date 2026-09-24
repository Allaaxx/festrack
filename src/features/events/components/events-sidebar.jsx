import { isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GlobeIcon, PlusIcon, ShareIcon } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const mockDots = [
  { date: '2026-08-31', colors: ['bg-purple-500'] },
  { date: '2026-09-01', colors: ['bg-purple-500'] },
  { date: '2026-09-02', colors: ['bg-purple-500', 'bg-purple-500'] },
  {
    date: '2026-09-03',
    colors: ['bg-purple-500', 'bg-purple-500'],
    moreCount: 1,
  },
  { date: '2026-09-04', colors: ['bg-yellow-500'] },
  { date: '2026-09-05', colors: ['bg-purple-500'] },
  { date: '2026-09-06', colors: ['bg-yellow-500', 'bg-red-500'] },
  { date: '2026-09-07', colors: ['bg-purple-500'] },
  { date: '2026-09-09', colors: ['bg-purple-500', 'bg-purple-500'] },
  { date: '2026-09-10', colors: ['bg-red-500'] },
  { date: '2026-09-12', colors: ['bg-blue-500', 'bg-yellow-500'] },
  { date: '2026-09-14', colors: ['bg-green-500'] },
  { date: '2026-09-18', colors: ['bg-red-500'] },
  { date: '2026-09-19', colors: ['bg-purple-500', 'bg-purple-500'] },
  { date: '2026-09-21', colors: ['bg-yellow-500'] },
  { date: '2026-09-23', colors: ['bg-green-500', 'bg-purple-500'] },
  { date: '2026-09-26', colors: ['bg-red-500'] },
  { date: '2026-09-28', colors: ['bg-blue-500'] },
  { date: '2026-10-01', colors: ['bg-purple-500'] },
  { date: '2026-10-02', colors: ['bg-purple-500', 'bg-purple-500'] },
  {
    date: '2026-10-03',
    colors: ['bg-purple-500', 'bg-purple-500'],
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
    <div className="bg-background flex h-full w-80 flex-col border-l">
      {/* Mini Calendar */}
      <div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={ptBR}
          className="w-full p-2"
          components={{
            DayButton: ({ day, modifiers, className, ...props }) => {
              const dotData = mockDots.find((d) =>
                isSameDay(parseISO(d.date), day.date)
              );

              return (
                <div className="group relative flex aspect-square flex-col items-center justify-center p-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'hover:bg-muted focus:ring-ring h-8 w-8 p-0 font-normal focus:ring-2 focus:ring-offset-1',
                      modifiers.selected &&
                        'bg-foreground text-background hover:bg-foreground hover:text-background',
                      className
                    )}
                    {...props}
                  >
                    {day.date.getDate()}
                  </Button>

                  {/* Dots Indicator */}
                  {dotData && (
                    <div className="pointer-events-none absolute bottom-0.5 flex w-full justify-center gap-0.5">
                      {dotData.colors.map((color, index) => (
                        <div
                          key={index}
                          className={cn('h-1 w-1 rounded-full', color)}
                        />
                      ))}
                      {dotData.moreCount > 0 && (
                        <span className="text-muted-foreground ml-0.5 text-[0.5rem] leading-none font-medium">
                          +{dotData.moreCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            },
          }}
        />
      </div>
      <Separator />
      {/* UP NEXT Section */}
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-end justify-between p-3">
          <div>
            <h3 className="text-foreground font-semibold">A SEGUIR</h3>
            <p className="text-muted-foreground text-xs">Setembro 2026</p>
          </div>
          <span className="text-foreground text-sm font-medium">
            {mockEvents.length}
          </span>
        </div>

        <ScrollArea className="max-h-60 w-full flex-1">
          <div className="mx-2 flex flex-col gap-2 px-2 pb-4">
            {mockEvents.map((event) => (
              <div
                key={event.id}
                className="group bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3 shadow-sm transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn('h-8 w-1 rounded-full', event.categoryColor)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{event.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {event.time}
                    </span>
                  </div>
                </div>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={event.avatar} alt={event.title} />
                  <AvatarFallback>{event.title.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <Separator />
      {/* Action Buttons */}
      <div className="flex flex-col gap-2 p-3">
        <Button className="w-full" size="default">
          <PlusIcon className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
        <Button variant="outline" className="w-full" size="default">
          <ShareIcon className="mr-2 h-4 w-4" />
          Compartilhar Disponibilidade
        </Button>
      </div>
      <Separator />
      {/* Timezone Footer */}
      <div className="flex items-center gap-3 p-3">
        <GlobeIcon className="h-3.5 w-3.5" />
        <div className="flex flex-col justify-center gap-0.5">
          <div className="text-muted-foreground flex items-center gap-1.5 text-[8px] font-semibold">
            <span>SEU FUSO HORÁRIO</span>
          </div>
          <p className="text-foreground text-xs font-bold">
            GMT-3 (-03:00) · America/Sao_Paulo
          </p>
        </div>
      </div>
    </div>
  );
}
