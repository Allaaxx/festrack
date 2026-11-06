import { Trash2Icon } from 'lucide-react';

import ConfirmDeleteDialog from '@/components/shared/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useDeleteEvent } from '@/features/events/api/hooks';

/**
 * Botão que exibe diálogo de confirmação antes de excluir um evento.
 *
 * @param {{
 *   event: { id: string, name?: string },
 *   onSuccess?: () => void,
 *   open?: boolean,
 *   onOpenChange?: (open: boolean) => void,
 *   trigger?: React.ReactElement | null,
 * }} props
 */
const DeleteEventButton = ({
  event,
  onSuccess,
  open,
  onOpenChange,
  trigger,
}) => {
  const isControlled = open !== undefined;
  const { mutateAsync: deleteEvent, isPending } = useDeleteEvent();

  const handleDelete = async () => {
    try {
      const deleted = await deleteEvent({ id: event?.id });
      onSuccess?.();
      if (deleted?.syncError) {
        toast.add({
          type: 'warning',
          title: 'Evento excluído com aviso',
          description:
            'Evento excluído no Festrack, mas não foi possível remover do Google Agenda.',
        });
      } else {
        toast.add({
          type: 'success',
          title: 'Evento excluído com sucesso!',
        });
      }
    } catch {
      toast.add({
        type: 'error',
        title: 'Não foi possível excluir o evento.',
        description: 'Tente novamente mais tarde.',
      });
    }
  };

  const dialogTrigger =
    trigger !== null && (!isControlled || trigger)
      ? (trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir evento"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
        ))
      : null;

  const description = event?.name
    ? `Você está prestes a excluir o evento "${event.name}". Esta ação não poderá ser desfeita.`
    : 'Esta ação não poderá ser desfeita.';

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={dialogTrigger}
      title="Excluir evento?"
      description={description}
      confirmLabel="Excluir evento"
      cancelLabel="Cancelar"
      isPending={isPending}
      onConfirm={handleDelete}
    />
  );
};

export default DeleteEventButton;
