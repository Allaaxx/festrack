import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Loader2Icon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useDeleteTransaction } from '@/features/finances/api/hooks';
import TransactionTypeBadge from '@/features/finances/components/transaction-type-badge';

const DeleteTransactionButton = ({
  transaction,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  trigger,
  render,
}) => {
  const { user } = useAuthContext();
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const deleteDialogIsOpen = isControlled ? controlledOpen : internalOpen;
  const [inputValue, setInputValue] = useState('');

  const handleOpenChange = (open) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    setInputValue('');
    onOpenChange?.(open);
  };

  const actionTrigger = trigger !== undefined ? trigger : render;
  const hasTrigger =
    actionTrigger !== null && (!isControlled || Boolean(actionTrigger));

  const { mutateAsync: deleteTransaction, isPending } = useDeleteTransaction();

  const isButtonDisabled =
    inputValue !== user?.firstName + '/' + transaction?.name || isPending;

  const handleDelete = () => {
    deleteTransaction(
      { id: transaction.id },
      {
        onSuccess: () => {
          handleOpenChange(false);
          onSuccess?.();
          toast.add({
            type: 'success',
            title: 'Transação deletada com sucesso!',
          });
        },
        onError: () => {
          toast.add({
            type: 'error',
            title: 'Ocorreu um erro ao deletar a transação!',
            description: 'Por favor tente novamente mais tarde.',
          });
        },
      }
    );
  };

  return (
    <Dialog open={deleteDialogIsOpen} onOpenChange={handleOpenChange}>
      {hasTrigger && (
        <DialogTrigger
          className="h-6"
          render={
            actionTrigger ?? (
              <Button
                variant="ghost"
                className="text-muted-foreground gap-2"
                aria-label="Excluir transação"
              >
                <Trash2Icon />
                Deletar
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:min-w-112.5">
        <DialogHeader>
          <DialogTitle>Deletar "{transaction.name}"</DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="space-y-2 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span className="text-foreground font-medium">
                {transaction.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor:</span>
              <span className="text-foreground font-medium">
                R$ {transaction.amount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoria:</span>
              <TransactionTypeBadge variant={transaction.type.toLowerCase()} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data:</span>
              <span className="text-foreground font-medium">
                {format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <FieldGroup>
          <Field>
            <Label htmlFor="name" className="text-primary-red">
              Para confirmar, digite "{user.firstName}/{transaction.name}" no
              campo abaixo
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Digite a transação a ser deletada."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="border-primary-red"
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            }
          />
          <Button
            variant="destructive"
            disabled={isButtonDisabled}
            onClick={handleDelete}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            Deletar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTransactionButton;
