import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import EventForm from '@/features/events/components/event-form';
import { useEditEventForm } from '@/features/events/forms/hooks';

import { DeleteEventButton } from '..';

const EditEventSheet = ({ event, trigger, open, onOpenChange }) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const sheetOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (value) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  const { form, onSubmit } = useEditEventForm({
    event,
    onSuccess: () => {
      handleOpenChange(false);
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
    <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger render={trigger} />}

      <SheetContent className="sm:min-w-112.5">
        <SheetHeader>
          <SheetTitle>Editar Evento</SheetTitle>
        </SheetHeader>

        <div className="px-2 sm:px-4">
          <EventForm form={form} onSubmit={onSubmit} formId="editEvent" />
        </div>

        <SheetFooter className="flex flex-row justify-between">
          <DeleteEventButton
            event={event}
            onSuccess={() => handleOpenChange(false)}
          />

          <div className="flex">
            <SheetClose
              render={
                <Button
                  type="reset"
                  variant="secondary"
                  size="lg"
                  disabled={form.formState.isSubmitting}
                  onClick={() => form.reset()}
                >
                  Cancelar
                </Button>
              }
            />
            <Button
              type="submit"
              form="editEvent"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2Icon className="animate-spin" />
              )}
              Salvar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EditEventSheet;
