import { CalendarDaysIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { EventsSidebarContent } from './events-sidebar-content';

export function EventsSidebarSheet({
  events,
  currentDate,
  onDateChange,
  sidebarDate,
  onSidebarDateChange,
  onEventCreate,
  tagFilter,
  ...rest
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            className="w-12 px-2.5 max-sm:h-8 sm:w-fit md:flex-row-reverse md:max-lg:h-8 lg:hidden"
          >
            <CalendarDaysIcon className="h-4 w-4 max-md:mr-0 md:mr-2 md:ml-2" />
            <span className="max-md:hidden">Mini</span>
          </Button>
        }
      />
      <SheetContent
        side="right"
        className="w-80 p-0 sm:max-w-sm"
        showCloseButton={false}
      >
        <EventsSidebarContent
          events={events}
          currentDate={currentDate}
          onDateChange={onDateChange}
          sidebarDate={sidebarDate}
          onSidebarDateChange={onSidebarDateChange}
          onEventCreate={onEventCreate}
          tagFilter={tagFilter}
          {...rest}
        />
      </SheetContent>
    </Sheet>
  );
}
