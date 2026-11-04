import { Loader2Icon, LogOutIcon } from 'lucide-react';
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
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import { useRemoveShopMember } from '@/features/shops/api/hooks';

const LeaveShopDialog = ({ trigger, open, onOpenChange, onSuccess }) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? open : internalOpen;

  const { user } = useAuthContext();
  const { activeShop } = useShopContext();
  const { mutateAsync: removeMember, isPending } = useRemoveShopMember();

  const handleOpenChange = (nextOpen) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleConfirmLeave = async () => {
    if (!activeShop?.id || !user?.id) return;
    try {
      const result = await removeMember({
        shopId: activeShop.id,
        userId: user.id,
      });
      toast.add({
        type: 'success',
        title: 'Você saiu da loja com sucesso!',
      });
      handleOpenChange(false);
      onSuccess?.(result);
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Não foi possível sair da loja',
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
                <LogOutIcon className="size-4" />
                Sair da Loja
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-destructive">
            Tem certeza que deseja sair desta loja?
          </DialogTitle>
          <DialogDescription>
            Você perderá o acesso aos eventos, transações e indicadores
            financeiros de <strong>{activeShop?.name}</strong>. Para retornar no
            futuro, será necessário receber um novo convite.
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
            onClick={handleConfirmLeave}
            disabled={isPending}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            Sim, sair da loja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveShopDialog;
