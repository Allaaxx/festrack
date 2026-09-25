import { CalendarDaysIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { EventsSidebarContent } from './events-sidebar-content';

export function EventsSidebarSheet(props) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="max-sm:h-8! md:max-lg:h-8! lg:hidden"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            <span className="sr-only">Abrir barra lateral</span>
          </Button>
        }
      />
      <SheetContent side="right" className="w-80 p-0 sm:max-w-sm">
        <EventsSidebarContent {...props} />
      </SheetContent>
    </Sheet>
  );
}
