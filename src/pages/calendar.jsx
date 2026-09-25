import { CalendarXIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreateEventDialog,
  EditEventSheet,
  EventCalendar,
  useEventCalendarPage,
} from '@/features/events';

const EventCalendarPage = () => {
  const {
    isLoading,
    isError,
    refetch,
    events,
    currentView,
    currentDate,
    createDialogOpen,
    setCreateDialogOpen,
    createInitialDate,
    selectedEvent,
    setSelectedEvent,
    handlers,
  } = useEventCalendarPage();

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="min-h-150 w-full flex-1 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="m-6 flex flex-col items-center justify-center gap-4 rounded-xl border py-16 text-center">
        <CalendarXIcon className="text-muted-foreground size-10" />
        <div className="space-y-1">
          <p className="font-medium">Não foi possível carregar os eventos.</p>
          <p className="text-muted-foreground text-sm">
            Verifique sua conexão e tente novamente.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="bg-background absolute inset-0 flex flex-row overflow-hidden rounded-lg border">
        <div className="flex min-w-0 flex-1 flex-col">
          <EventCalendar
            events={events}
            view={currentView}
            onViewChange={handlers.handleViewChange}
            currentDate={currentDate}
            onDateChange={handlers.handleDateChange}
            onEventCreate={handlers.handleEventCreate}
            onEventSelect={handlers.handleEventSelect}
            onEventUpdate={handlers.handleEventUpdate}
            className="rounded-none border-0 shadow-none"
          />
        </div>
      </div>

      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialDate={createInitialDate}
      />

      {selectedEvent && (
        <EditEventSheet
          event={selectedEvent}
          open={Boolean(selectedEvent)}
          onOpenChange={(open) => {
            if (!open) setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default EventCalendarPage;
