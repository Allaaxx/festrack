import {
  CalendarClockIcon,
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
    <div className="bg-background sticky top-0 z-40 flex h-14 items-center justify-between gap-1 border-b px-2 sm:h-16 sm:px-4">
      <div className="flex items-center gap-1 max-sm:justify-between sm:gap-4">
        <div className="flex items-center gap-1">
          <Button
            onClick={() => onEventCreate(new Date())}
            className="max-sm:hidden md:max-lg:h-8"
          >
            <PlusIcon />
            <span>Novo evento</span>
          </Button>
          <Button
            size="icon-sm"
            className="sm:hidden"
            onClick={() => onEventCreate(new Date())}
          >
            <PlusIcon />
          </Button>
          <Button
            variant="outline"
            className="max-sm:hidden md:max-lg:h-8"
            onClick={onToday}
          >
            <CalendarClockIcon />
            <span>Hoje</span>
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="sm:hidden"
            onClick={onToday}
          >
            <CalendarClockIcon />
          </Button>
        </div>
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
      </div>
    </div>
  );
}

export default CalendarHeader;
