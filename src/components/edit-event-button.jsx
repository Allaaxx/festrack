import { ExternalLinkIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';

import EventForm from '@/components/event-form';
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
import { useEditEventForm } from '@/forms/hooks/event';

const FORM_ID = 'editEvent';

/**
 * Botão que abre o sheet de edição de um evento.
 *
 * @param {{ event: { id: string, name: string, description: string | null, startDate: string, endDate: string } }} props
 */
const EditEventButton = ({ event }) => {
  const [sheetIsOpen, setSheetIsOpen] = useState(false);

  const { form, onSubmit } = useEditEventForm({
    event,
    onSuccess: () => {
      setSheetIsOpen(false);
      toast.add({
        type: 'success',
        title: 'Evento atualizado com sucesso!',
      });
    },
    onError: () => {
      toast.add({
        type: 'error',
        title: 'Não foi possível atualizar o evento.',
        description: 'Tente novamente mais tarde.',
      });
    },
  });

  return (
    <Sheet open={sheetIsOpen} onOpenChange={setSheetIsOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon">
            <ExternalLinkIcon className="text-muted-foreground" />
          </Button>
        }
      />

      <SheetContent className="sm:min-w-112.5">
        <SheetHeader>
          <SheetTitle>Editar evento</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-2 sm:space-y-6 sm:px-4">
          <EventForm form={form} onSubmit={onSubmit} formId={FORM_ID} />
        </div>

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
            form={FORM_ID}
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting && (
              <Loader2Icon className="animate-spin" />
            )}
            Salvar alterações
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EditEventButton;
