import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

import EventForm from '@/components/event-form';
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
import { useCreateEventForm } from '@/forms/hooks/event';

const FORM_ID = 'createEvent';

const CreateEventButton = () => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const { form, onSubmit } = useCreateEventForm({
    onSuccess: () => {
      setDialogIsOpen(false);
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

  const handleOpenChange = (open) => {
    setDialogIsOpen(open);
    if (!open) form.reset();
  };

  return (
    <Dialog open={dialogIsOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="w-full"
        render={
          <Button>
            <PlusIcon />
            Novo evento
          </Button>
        }
      />

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
            form={FORM_ID}
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

export default CreateEventButton;
