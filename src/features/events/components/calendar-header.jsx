import {
  CalendarArrowUp,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { EventsSidebarSheet } from './events-sidebar-sheet';

export function CalendarHeader({
  view,
  viewTitle,
  viewLabels,
  onViewChange,
  onEventCreate,
  onToday,
  onPrevious,
  onNext,
  events,
  currentDate,
  onDateChange,
}) {
  return (
    <div className="flex flex-col">
      <div className="sm:p-4h-14 sticky flex flex-wrap items-center justify-between gap-2 border-b p-3 px-2 sm:h-16 sm:flex-nowrap sm:px-4">
        {/* Left Side: Today & Navigation */}
        <div className="flex w-full flex-row-reverse items-center justify-between gap-2 sm:w-fit sm:flex-row sm:gap-4">
          <div className="space-x-2">
            <Button
              variant="outline"
              className="w-12 max-sm:h-8 sm:w-fit md:max-lg:h-8"
              onClick={onToday}
            >
              <CalendarArrowUp className="h-4 w-4 sm:mr-2" />
              <span className="max-sm:hidden">Hoje</span>
            </Button>
            <EventsSidebarSheet
              events={events}
              currentDate={currentDate}
              onDateChange={onDateChange}
              onEventCreate={onEventCreate}
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPrevious}
              aria-label="Anterior"
            >
              <ChevronLeftIcon />
            </Button>
            <h2 className="truncate text-center text-[11px] font-semibold min-[375px]:text-[13px] sm:text-lg md:text-xl">
              {viewTitle && typeof viewTitle === 'object' ? (
                <>
                  <span className="sm:hidden">{viewTitle.mobile}</span>
                  <span className="max-sm:hidden">{viewTitle.desktop}</span>
                </>
              ) : (
                viewTitle
              )}
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNext}
              aria-label="Próximo"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        {/* Right Side: View & New Event */}
        <div className="flex w-full flex-row items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="w-12 max-sm:h-8! sm:w-fit">
                  <span>
                    <span className="sm:hidden" aria-hidden="true">
                      {viewLabels[view]?.charAt(0)}
                    </span>
                    <span className="max-sm:sr-only">{viewLabels[view]}</span>
                  </span>
                  <ChevronDownIcon className="-me-1 opacity-60" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-32">
              <DropdownMenuItem onClick={() => onViewChange('month')}>
                Mês <DropdownMenuShortcut>M</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange('week')}>
                Semana <DropdownMenuShortcut>S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange('day')}>
                Dia <DropdownMenuShortcut>D</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => onEventCreate(new Date())}
            className="w-12 max-sm:h-8 sm:w-fit md:max-lg:h-8"
          >
            <PlusIcon className="h-4 w-4 sm:mr-2" />
            <span className="max-sm:hidden">Novo evento</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex scrollbar-none items-center gap-3 overflow-x-auto border-t border-b px-2 py-2 sm:px-4">
        <span className="text-muted-foreground shrink-0 text-sm font-medium">
          Exibir:
        </span>
        <div className="flex shrink-0 gap-2">
          <span className="border-border bg-muted/50 text-foreground hover:bg-muted flex cursor-pointer items-center rounded-full border px-3 py-1 text-xs font-medium">
            Todos
          </span>
          <span className="flex cursor-pointer items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-100/50 px-3 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-100 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            Família
          </span>
          <span className="flex cursor-pointer items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100/50 px-3 py-1 text-xs font-medium text-purple-800 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            Trabalho
          </span>
          <span className="flex cursor-pointer items-center gap-1.5 rounded-full border border-red-200 bg-red-100/50 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            Pessoal
          </span>
          <span className="flex cursor-pointer items-center gap-1.5 rounded-full border border-green-200 bg-green-100/50 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Feriado
          </span>
          <span className="flex cursor-pointer items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100/50 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            Outros
          </span>
        </div>
      </div>
    </div>
  );
}

export default CalendarHeader;
