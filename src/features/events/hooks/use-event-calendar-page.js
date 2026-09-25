import { format, isValid } from 'date-fns';
import { useMemo, useState } from 'react';

import { toast } from '@/components/ui/toast';
import { LOCAL_STORAGE_EVENT_CALENDAR_FILTERS_KEY } from '@/constants/local-storage';
import {
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

const getDefaultCalendarParams = () => {
  const now = new Date();
  return {
    view: 'month',
    date: format(now, 'yyyy-MM-dd'),
    sidebarDate: '',
  };
};

export function useEventCalendarPage() {
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

  const sidebarDate = useMemo(() => {
    if (!isValidDateString(params.sidebarDate)) return currentDate;
    return new Date(params.sidebarDate + 'T00:00:00');
  }, [params.sidebarDate, currentDate]);

  const handleViewChange = (newView) => {
    setParams({ view: newView });
  };

  const handleDateChange = (newDate) => {
    setParams({ date: format(newDate, 'yyyy-MM-dd') });
  };

  const handleSidebarDateChange = (newDate) => {
    setParams({ sidebarDate: format(newDate, 'yyyy-MM-01') });
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

  return {
    isLoading,
    isError,
    refetch,
    events,
    currentView,
    currentDate,
    sidebarDate,
    createDialogOpen,
    setCreateDialogOpen,
    createInitialDate,
    selectedEvent,
    setSelectedEvent,
    handlers: {
      handleViewChange,
      handleDateChange,
      handleSidebarDateChange,
      handleEventCreate,
      handleEventSelect,
      handleEventUpdate,
    },
  };
}
