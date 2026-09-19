import { format, isValid } from 'date-fns';
import { CalendarXIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LOCAL_STORAGE_EVENT_CALENDAR_FILTERS_KEY } from '@/constants/local-storage';
import {
  CreateEventDialog,
  EditEventSheet,
  EventCalendar,
  mapEventToCalendarItem,
  useGetEvents,
} from '@/features/events';
import useStoredSearchParams from '@/hooks/use-stored-search-params';

const isValidDateString = (val) => {
  if (!val || typeof val !== 'string') return false;
  const date = new Date(val + 'T00:00:00');
  return isValid(date);
};

const getDefaultCalendarParams = () => ({
  view: 'month',
  date: format(new Date(), 'yyyy-MM-dd'),
});

const EventCalendarPage = () => {
  const { data: rawEvents = [], isLoading, isError, refetch } = useGetEvents();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [params, setParams] = useStoredSearchParams(
    LOCAL_STORAGE_EVENT_CALENDAR_FILTERS_KEY,
    getDefaultCalendarParams,
    {
      requiredKeys: ['view', 'date'],
      validate: (data) =>
        ['month', 'week', 'day'].includes(data?.view) &&
        isValidDateString(data?.date),
    }
  );

  const currentView = ['month', 'week', 'day'].includes(params.view)
    ? params.view
    : 'month';

  const currentDate = useMemo(() => {
    if (!isValidDateString(params.date)) return new Date();
    return new Date(params.date + 'T00:00:00');
  }, [params.date]);

  const handleViewChange = (newView) => {
    setParams({ view: newView });
  };

  const handleDateChange = (newDate) => {
    setParams({ date: format(newDate, 'yyyy-MM-dd') });
  };

  const events = useMemo(
    () => rawEvents.map(mapEventToCalendarItem),
    [rawEvents]
  );

  const handleEventCreate = (date) => {
    setCreateInitialDate(date instanceof Date ? date : new Date());
    setCreateDialogOpen(true);
  };

  const handleEventSelect = (calendarItem) => {
    setSelectedEvent(calendarItem.rawEvent ?? null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="min-h-[600px] w-full flex-1 rounded-lg" />
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
    <>
      <EventCalendar
        events={events}
        view={currentView}
        onViewChange={handleViewChange}
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onEventCreate={handleEventCreate}
        onEventSelect={handleEventSelect}
      />

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
    </>
  );
};

export default EventCalendarPage;
