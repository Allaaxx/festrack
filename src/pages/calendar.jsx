import { format, isValid } from 'date-fns';
import { CalendarXIcon, Loader2Icon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/date-picker';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { LOCAL_STORAGE_EVENT_CALENDAR_FILTERS_KEY } from '@/constants/local-storage';
import {
  DeleteEventButton,
  EventCalendar,
  EventForm,
  mapEventToCalendarItem,
  useCreateEventForm,
  useEditEventForm,
  useGetEvents,
} from '@/features/events';
import useStoredSearchParams from '@/hooks/use-stored-search-params';

const CREATE_FORM_ID = 'calendarCreateEvent';

const EditEventSheet = ({ event, open, onOpenChange }) => {
  const { form, onSubmit } = useEditEventForm({
    event,
    onSuccess: () => {
      onOpenChange(false);
      toast.add({
        type: 'success',
        title: 'Evento editado com sucesso!',
      });
    },
    onError: () => {
      toast.add({
        type: 'error',
        title: 'Ocorreu um erro ao editar o evento!',
        description: 'Por favor tente novamente mais tarde.',
      });
    },
  });

  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:min-w-112.5">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <SheetTitle>Editar Evento</SheetTitle>
          <DeleteEventButton event={event} />
        </SheetHeader>
        <form
          id="calendarEditEvent"
          className="space-y-4 px-2 sm:space-y-8 sm:px-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="editName">Nome</FieldLabel>
                  <Input
                    {...field}
                    id="editName"
                    aria-invalid={fieldState.invalid}
                    placeholder="Digite o nome do evento"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="editDescription">
                    Descrição (opcional)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="editDescription"
                    aria-invalid={fieldState.invalid}
                    placeholder="Digite a descrição do evento"
                    autoComplete="off"
                    value={field.value ?? ''}
                    rows={3}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="startDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="editStartDate">Data inicial</FieldLabel>
                  <DatePicker
                    {...field}
                    id="editStartDate"
                    aria-invalid={fieldState.invalid}
                    placeholder="Selecione a data inicial"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="endDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="editEndDate">Data final</FieldLabel>
                  <DatePicker
                    {...field}
                    id="editEndDate"
                    aria-invalid={fieldState.invalid}
                    placeholder="Selecione a data final"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <SheetFooter>
          <SheetClose
            render={
              <Button
                type="reset"
                variant="secondary"
                disabled={form.formState.isSubmitting}
                className="w-full"
                onClick={() => form.reset()}
              >
                Cancelar
              </Button>
            }
          />
          <Button
            type="submit"
            form="calendarEditEvent"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting && (
              <Loader2Icon className="animate-spin" />
            )}
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const CreateEventDialog = ({ open, onOpenChange, initialDate }) => {
  const { form, onSubmit } = useCreateEventForm({
    onSuccess: () => {
      onOpenChange(false);
      toast.add({
        type: 'success',
        title: 'Evento criado com sucesso!',
      });
    },
    onError: () => {
      toast.add({
        type: 'error',
        title: 'Não foi possível criar o evento.',
        description: 'Tente novamente mais tarde.',
      });
    },
  });

  useEffect(() => {
    if (open) {
      const targetDate =
        initialDate instanceof Date ? initialDate : new Date();
      form.reset({
        name: '',
        description: '',
        startDate: targetDate,
        endDate: targetDate,
      });
    }
  }, [initialDate, open, form]);

  const handleOpenChange = (isOpen) => {
    onOpenChange(isOpen);
    if (!isOpen) form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:min-w-112.5">
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
          <DialogDescription>
            Insira as informações do evento abaixo.
          </DialogDescription>
        </DialogHeader>

        <EventForm form={form} onSubmit={onSubmit} formId={CREATE_FORM_ID} />

        <DialogFooter>
          <DialogClose
            render={
              <Button
                type="reset"
                variant="secondary"
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-1/2"
                onClick={() => form.reset()}
              >
                Cancelar
              </Button>
            }
          />
          <Button
            type="submit"
            form={CREATE_FORM_ID}
            disabled={form.formState.isSubmitting}
            className="w-full sm:w-1/2"
          >
            {form.formState.isSubmitting && (
              <Loader2Icon className="animate-spin" />
            )}
            Criar evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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
        <Skeleton className="h-[calc(100svh-var(--header-height)-6.5rem)] w-full flex-1 rounded-lg" />
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
