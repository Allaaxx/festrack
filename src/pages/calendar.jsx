import { format, isValid } from 'date-fns';
import { CalendarXIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { LOCAL_STORAGE_EVENT_CALENDAR_FILTERS_KEY } from '@/constants/local-storage';
import {
  CreateEventDialog,
  EditEventSheet,
  EventCalendar,
  mapEventToCalendarItem,
  useEditEvent,
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

  const editEventMutation = useEditEvent();

  const handleEventCreate = (date) => {
    setCreateInitialDate(date instanceof Date ? date : new Date());
    setCreateDialogOpen(true);
  };

  const handleEventSelect = (calendarItem) => {
    setSelectedEvent(calendarItem.rawEvent ?? null);
  };

  const handleEventUpdate = (updatedItem) => {
    const raw = updatedItem.rawEvent || {};
    const isAllDay = Boolean(updatedItem.allDay ?? raw.allDay);
    const eventName = updatedItem.title || raw.name || 'Evento';
    const isResize = updatedItem.action === 'resize';

    editEventMutation.mutate(
      {
        id: updatedItem.id,
        name: updatedItem.title || raw.name,
        description: updatedItem.description ?? raw.description,
        startDate: updatedItem.start,
        endDate: updatedItem.end,
        allDay: isAllDay,
        startTime: format(updatedItem.start, 'HH:mm'),
        endTime: format(updatedItem.end, 'HH:mm'),
      },
      {
        onSuccess: () => {
          toast.add({
            type: 'success',
            title: isResize
              ? `Evento "${eventName}" redimensionado`
              : `Evento "${eventName}" movido`,
          });
        },
        onError: () => {
          toast.add({
            type: 'error',
            title: `Ocorreu um erro ao ${isResize ? 'redimensionar' : 'mover'} o evento!`,
            description: 'Por favor tente novamente mais tarde.',
          });
        },
      }
    );
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
        onEventUpdate={handleEventUpdate}
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
