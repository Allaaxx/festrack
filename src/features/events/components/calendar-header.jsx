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

import { EventStatusFilters } from './event-status-filters';
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
  sidebarDate,
  onSidebarDateChange,
  selectedStatuses,
  onToggleStatus,
}) {
  return (
    <div className="flex flex-col">
      <div className="sm:p-4h-14 sticky flex flex-wrap items-center justify-between gap-2 border-b p-3 px-2 sm:h-16 sm:flex-nowrap sm:px-4">
        {/* Left Side: Today & Navigation */}
        <div className="flex w-full flex-row-reverse items-center justify-between gap-2 sm:w-fit sm:flex-row sm:gap-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="w-12 max-sm:h-8 sm:w-fit md:max-lg:h-8"
              onClick={onToday}
            >
              <CalendarArrowUp className="h-4 w-4 md:mr-2" />
              <span className="max-md:hidden">Hoje</span>
            </Button>
            <EventsSidebarSheet
              events={events}
              currentDate={currentDate}
              onDateChange={onDateChange}
              sidebarDate={sidebarDate}
              onSidebarDateChange={onSidebarDateChange}
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
      <EventStatusFilters
        selectedStatuses={selectedStatuses}
        onToggleStatus={onToggleStatus}
      />
    </div>
  );
}

export default CalendarHeader;
