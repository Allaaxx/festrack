import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { Controller } from 'react-hook-form';

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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useShopContext } from '@/contexts/shop';
import { useCreateShopForm } from '@/features/shops/forms/hooks';

const FORM_ID = 'createShopForm';

const CreateShopDialog = ({
  trigger,
  open,
  onOpenChange,
  isOnboarding = false,
  onSuccess,
}) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? open : internalOpen;
  const { setActiveShop } = useShopContext();

  const closeDialog = () => {
    if (!isControlled) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
  };

  const { form, onSubmit } = useCreateShopForm({
    onSuccess: (createdShop) => {
      if (createdShop) {
        setActiveShop(createdShop);
      }
      form.reset();
      closeDialog();
      toast.add({
        type: 'success',
        title: 'Loja criada com sucesso!',
      });
      onSuccess?.(createdShop);
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Não foi possível criar a loja.',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Tente novamente mais tarde.',
      });
    },
  });

  const handleOpenChange = (nextOpen) => {
    if (isOnboarding && !nextOpen) {
      return;
    }
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      form.reset();
    }
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={isOnboarding}
    >
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-md" showCloseButton={!isOnboarding}>
        <DialogHeader>
          <DialogTitle>
            {isOnboarding ? 'Crie sua primeira loja' : 'Nova loja'}
          </DialogTitle>
          <DialogDescription>
            {isOnboarding
              ? 'Para começar a usar o Festrack, crie sua primeira loja e organize suas finanças e eventos.'
              : 'Insira as informações abaixo para criar uma nova loja.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id={FORM_ID}
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="shopName">Nome da loja</FieldLabel>
                  <Input
                    {...field}
                    id="shopName"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ex: Atelier Central, Minha Empresa..."
                    autoComplete="off"
                    disabled={form.formState.isSubmitting}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="shopDescription">
                    Descrição (opcional)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="shopDescription"
                    aria-invalid={fieldState.invalid}
                    placeholder="Descreva o propósito ou unidade da loja..."
                    autoComplete="off"
                    disabled={form.formState.isSubmitting}
                    value={field.value ?? ''}
                    rows={3}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          {!isOnboarding && (
            <DialogClose
              render={
                <Button
                  variant="secondary"
                  disabled={form.formState.isSubmitting}
                  className="w-full sm:w-1/2"
                  onClick={() => form.reset()}
                >
                  Cancelar
                </Button>
              }
            />
          )}
          <Button
            type="submit"
            form={FORM_ID}
            className={isOnboarding ? 'w-full' : 'w-full sm:w-1/2'}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2Icon className="animate-spin" />
            )}
            Criar loja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateShopDialog;
