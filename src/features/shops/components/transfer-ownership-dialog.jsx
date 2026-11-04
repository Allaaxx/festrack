import { ArrowRightLeftIcon, Loader2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  useGetShopMembers,
  useTransferShopOwnership,
} from '@/features/shops/api/hooks';
import { normalizeShopMember } from '@/features/shops/helpers/member';

const TransferOwnershipDialog = ({
  trigger,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? open : internalOpen;

  const [selectedUserId, setSelectedUserId] = useState('');

  const { user } = useAuthContext();
  const { activeShop } = useShopContext();
  const { data: rawMembers = [] } = useGetShopMembers({
    shopId: activeShop?.id,
  });
  const { mutateAsync: transferOwnership, isPending } =
    useTransferShopOwnership();

  const eligibleMembers = useMemo(
    () =>
      (Array.isArray(rawMembers) ? rawMembers : [])
        .map(normalizeShopMember)
        .filter((member) => member && member.userId !== user?.id),
    [rawMembers, user?.id]
  );

  const selectedMember = useMemo(
    () => eligibleMembers.find((member) => member.userId === selectedUserId),
    [eligibleMembers, selectedUserId]
  );

  const handleOpenChange = (nextOpen) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      setSelectedUserId('');
    }
  };

  const handleConfirmTransfer = async () => {
    if (!activeShop?.id || !selectedUserId) return;
    try {
      const result = await transferOwnership({
        shopId: activeShop.id,
        newOwnerUserId: selectedUserId,
      });
      toast.add({
        type: 'success',
        title: 'Posse transferida com sucesso!',
        description: `${selectedMember?.displayName || 'O membro selecionado'} agora é o proprietário da loja.`,
      });
      handleOpenChange(false);
      onSuccess?.(result);
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Não foi possível transferir a posse',
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
              <Button variant="outline" className="shrink-0 max-lg:w-full">
                <ArrowRightLeftIcon className="size-4" />
                Transferir Posse
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle>Transferir posse da loja</DialogTitle>
          <DialogDescription>
            Selecione outro membro ativo para assumir a propriedade de{' '}
            <strong>{activeShop?.name}</strong>. Após a transferência, sua
            função passará a ser <strong>Membro</strong>.
          </DialogDescription>
        </DialogHeader>

        {eligibleMembers.length > 0 ? (
          <Field>
            <FieldLabel htmlFor="transfer-owner-select">
              Novo proprietário
            </FieldLabel>
            <Select
              value={selectedUserId}
              onValueChange={(value) => setSelectedUserId(value)}
              disabled={isPending}
            >
              <SelectTrigger id="transfer-owner-select" className="w-full">
                <SelectValue placeholder="Selecione um membro">
                  {selectedMember
                    ? `${selectedMember.displayName} (${selectedMember.email})`
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {eligibleMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.displayName} ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <p className="text-muted-foreground text-sm">
            Não há outros membros ativos nesta loja. Convide outro colaborador e
            aguarde sua entrada antes de transferir a posse.
          </p>
        )}

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
            disabled={!selectedUserId || isPending}
            onClick={handleConfirmTransfer}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            Confirmar transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferOwnershipDialog;
