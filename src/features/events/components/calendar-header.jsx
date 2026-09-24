import {
  CalendarIcon,
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

export function CalendarHeader({
  view,
  viewTitle,
  viewLabels,
  onViewChange,
  onEventCreate,
  onToday,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex flex-col">
      <div className="bg-background sticky top-0 z-40 flex h-14 items-center justify-between gap-1 px-2 sm:h-16 sm:px-4">
        {/* Left Side: Today & Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            className="max-sm:h-8 md:max-lg:h-8"
            onClick={onToday}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="max-sm:hidden">Hoje</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPrevious}
              aria-label="Anterior"
            >
              <ChevronLeftIcon />
            </Button>
            <h2 className="truncate text-center text-sm font-semibold sm:text-lg md:text-xl">
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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="max-sm:h-8!">
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
                Semana <DropdownMenuShortcut>W</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewChange('day')}>
                Dia <DropdownMenuShortcut>D</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => onEventCreate(new Date())}
            className="max-sm:h-8 md:max-lg:h-8"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            <span className="max-sm:hidden">Novo evento</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-3 border-t border-b px-2 py-2 sm:px-4 overflow-x-auto scrollbar-none">
        <span className="text-sm text-muted-foreground font-medium shrink-0">Exibir:</span>
        <div className="flex gap-2 shrink-0">
          <span className="flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground cursor-pointer hover:bg-muted">
            Todos
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-100/50 px-3 py-1 text-xs font-medium text-yellow-800 cursor-pointer hover:bg-yellow-100 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            Família
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100/50 px-3 py-1 text-xs font-medium text-purple-800 cursor-pointer hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            Trabalho
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100/50 px-3 py-1 text-xs font-medium text-red-800 cursor-pointer hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            Pessoal
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-100/50 px-3 py-1 text-xs font-medium text-green-800 cursor-pointer hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Feriado
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100/50 px-3 py-1 text-xs font-medium text-blue-800 cursor-pointer hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            Outros
          </span>
        </div>
      </div>
    </div>
  );
}

export default CalendarHeader;
