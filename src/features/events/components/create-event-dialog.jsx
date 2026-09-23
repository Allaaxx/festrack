import { addHours, format, startOfDay } from 'date-fns';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import EventForm from '@/features/events/components/event-form';
import { useCreateEventForm } from '@/features/events/forms/hooks';

const FORM_ID = 'createEvent';

const CreateEventDialog = ({ trigger, open, onOpenChange, initialDate }) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? open : internalOpen;

  const { form, onSubmit } = useCreateEventForm({
    onSuccess: () => {
      handleOpenChange(false);
      toast.add({ type: 'success', title: 'Evento criado com sucesso!' });
    },
    onError: () => {
      toast.add({
        type: 'error',
        title: 'Não foi possível criar o evento.',
        description: 'Tente novamente mais tarde.',
      });
    },
  });

  const handleOpenChange = (value) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
    if (!value) form.reset();
  };

  useEffect(() => {
    if (dialogOpen) {
      const targetDate = initialDate instanceof Date ? initialDate : new Date();
      const hasSpecificTime =
        initialDate instanceof Date &&
        (initialDate.getHours() !== 0 || initialDate.getMinutes() !== 0);

      const startTime = hasSpecificTime ? format(targetDate, 'HH:mm') : '09:00';
      const endTime = hasSpecificTime
        ? format(addHours(targetDate, 1), 'HH:mm')
        : '10:00';

      form.reset({
        name: '',
        description: '',
        startDate: startOfDay(targetDate),
        endDate: startOfDay(targetDate),
        allDay: false,
        startTime,
        endTime,
      });
    }
  }, [initialDate, dialogOpen, form]);

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:min-w-112.5">
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
          <DialogDescription>
            Insira as informações do evento abaixo.
          </DialogDescription>
        </DialogHeader>

        <EventForm form={form} onSubmit={onSubmit} formId={FORM_ID} />

        <DialogFooter>
          <DialogClose
            render={
              <Button
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
            form={FORM_ID}
            className="w-full sm:w-1/2"
            disabled={form.formState.isSubmitting}
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

export default CreateEventDialog;
