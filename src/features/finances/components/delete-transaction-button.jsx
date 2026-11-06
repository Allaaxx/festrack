import { Trash2Icon } from 'lucide-react';

import ConfirmDeleteDialog from '@/components/shared/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useDeleteTransaction } from '@/features/finances/api/hooks';

/**
 * Botão que exibe diálogo de confirmação antes de excluir uma transação.
 *
 * @param {Object} props
 * @param {Object} props.transaction - Objeto da transação contendo id e name
 * @param {Function} [props.onSuccess] - Callback executado após a exclusão bem-sucedida
 * @param {boolean} [props.open] - Controle de abertura externa do diálogo
 * @param {Function} [props.onOpenChange] - Callback executado ao alterar o estado de abertura
 * @param {React.ReactElement|null} [props.trigger] - Elemento de disparo customizado
 * @param {React.ReactElement} [props.render] - Alias para trigger (retrocompatibilidade)
 */
const DeleteTransactionButton = ({
  transaction,
  onSuccess,
  open,
  onOpenChange,
  trigger,
  render,
}) => {
  const isControlled = open !== undefined;
  const actionTrigger = trigger !== undefined ? trigger : render;
  const hasTrigger =
    actionTrigger !== null && (!isControlled || Boolean(actionTrigger));

  const resolvedTrigger = hasTrigger
    ? (actionTrigger ?? (
        <Button
          variant="ghost"
          className="text-muted-foreground gap-2"
          aria-label="Excluir transação"
        >
          <Trash2Icon />
          Excluir
        </Button>
      ))
    : null;

  const { mutateAsync: deleteTransaction, isPending } = useDeleteTransaction();

  const handleDelete = async () => {
    if (!transaction?.id) return;
    try {
      await deleteTransaction({ id: transaction.id });
      onSuccess?.();
      toast.add({
        type: 'success',
        title: 'Transação excluída com sucesso!',
      });
    } catch {
      toast.add({
        type: 'error',
        title: 'Não foi possível excluir a transação.',
        description: 'Tente novamente mais tarde.',
      });
    }
  };

  const description = transaction?.name
    ? `Você está prestes a excluir a transação "${transaction.name}". Esta ação não poderá ser desfeita.`
    : 'Esta ação não poderá ser desfeita.';

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={resolvedTrigger}
      title="Excluir transação?"
      description={description}
      confirmLabel="Excluir transação"
      cancelLabel="Cancelar"
      isPending={isPending}
      onConfirm={handleDelete}
    />
  );
};

export default DeleteTransactionButton;
