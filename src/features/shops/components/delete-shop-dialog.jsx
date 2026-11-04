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
import { useShopContext } from '@/contexts/shop';
import { useDeleteShop } from '@/features/shops/api/hooks';

const DeleteShopDialog = ({ trigger, open, onOpenChange, onSuccess }) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? open : internalOpen;

  const { activeShop } = useShopContext();
  const { mutateAsync: deleteShop, isPending } = useDeleteShop();

  const handleOpenChange = (nextOpen) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleConfirmDelete = async () => {
    if (!activeShop?.id) return;
    try {
      const deleted = await deleteShop({ shopId: activeShop.id });
      toast.add({
        type: 'success',
        title: 'Loja excluída com sucesso!',
        description: 'A loja e todos os seus dados foram removidos.',
      });
      handleOpenChange(false);
      onSuccess?.(deleted);
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Não foi possível excluir a loja',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Tente novamente mais tarde.',
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger !== null && (!isControlled || trigger) && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button
                variant="outline"
                className="border-destructive! text-destructive! hover:bg-destructive/10! focus-visible:ring-destructive/20 shrink-0 max-lg:w-full"
              >
                <Trash2Icon className="size-4" />
                Excluir Loja
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-destructive">
            Tem certeza que deseja excluir esta loja?
          </DialogTitle>
          <DialogDescription>
            Esta ação é permanente e não poderá ser desfeita. Todos os eventos,
            transações, membros e convites vinculados a{' '}
            <strong>{activeShop?.name}</strong> serão excluídos imediatamente.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-end">
          <DialogClose
            render={
              <Button variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            }
          />
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isPending}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            Sim, excluir loja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteShopDialog;
