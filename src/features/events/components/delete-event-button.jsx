import { Loader2Icon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

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
import { useDeleteEvent } from '@/features/events/api/hooks';

/**
 * Botão que exibe diálogo de confirmação antes de excluir um evento.
 *
 * @param {{ event: { id: string, name: string } }} props
 */
const DeleteEventButton = ({ event, onSuccess }) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const { mutateAsync: deleteEvent, isPending } = useDeleteEvent();

  const handleDelete = async () => {
    try {
      await deleteEvent({ id: event.id });
      setDialogIsOpen(false);
      onSuccess?.();
      toast.add({
        type: 'success',
        title: 'Evento excluído com sucesso!',
      });
    } catch {
      toast.add({
        type: 'error',
        title: 'Não foi possível excluir o evento.',
        description: 'Tente novamente mais tarde.',
      });
    }
  };

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
        }
      />

      <DialogContent className="sm:min-w-112.5">
        <DialogHeader>
          <DialogTitle>Excluir evento?</DialogTitle>
          <DialogDescription>
            Você está prestes a excluir o evento &quot;{event.name}&quot;. Esta
            ação não poderá ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose
            render={
              <Button
                variant="outline"
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            }
          />
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
            className="w-full sm:w-auto"
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            Excluir evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEventButton;
