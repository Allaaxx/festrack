import { CheckIcon, CopyIcon, Loader2Icon, PlusIcon } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useShopContext } from '@/contexts/shop';
import { useInviteMemberForm } from '@/features/shops/forms/hooks';
import {
  buildInvitationLink,
  copyInvitationLink,
  getRoleLabel,
} from '@/features/shops/helpers/member';

const FORM_ID = 'inviteMemberForm';

const InviteMemberDialog = ({
  trigger,
  open,
  onOpenChange,
  shopId: propShopId,
  onSuccess,
}) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = isControlled ? open : internalOpen;

  const [generatedInvitation, setGeneratedInvitation] = useState(null);
  const [copied, setCopied] = useState(false);

  const { activeShop } = useShopContext();
  const shopId = propShopId ?? activeShop?.id;

  const { form, onSubmit } = useInviteMemberForm({
    shopId,
    onSuccess: (invitation) => {
      setGeneratedInvitation(invitation);
      setCopied(false);
      toast.add({
        type: 'success',
        title: 'Convite enviado com sucesso!',
        description: `Um link de convite foi gerado para ${invitation?.email}.`,
      });
      onSuccess?.(invitation);
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Não foi possível enviar o convite',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Tente novamente mais tarde.',
      });
    },
  });

  const handleOpenChange = (nextOpen) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      setGeneratedInvitation(null);
      setCopied(false);
      form.reset();
    }
  };

  const inviteUrl = buildInvitationLink(generatedInvitation?.token);

  const handleCopyLink = async () => {
    const didCopy = await copyInvitationLink(generatedInvitation?.token, toast);
    if (didCopy) {
      setCopied(true);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger !== null && (!isControlled || trigger) && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button size="sm">
                <PlusIcon className="size-4" />
                Convidar Membro
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            {generatedInvitation
              ? 'Compartilhe o link abaixo com a pessoa convidada para que ela possa ingressar na loja.'
              : 'Envie um convite por e-mail para adicionar um novo membro à loja.'}
          </DialogDescription>
        </DialogHeader>

        {generatedInvitation ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="generated-invite-link">
                Link do convite
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="generated-invite-link"
                  value={inviteUrl}
                  readOnly
                  aria-label="Link do convite"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                  Copiar link
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                className="w-full"
                onClick={() => handleOpenChange(false)}
              >
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <form
              id={FORM_ID}
              className="space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="invite-member-email">
                        E-mail
                      </FieldLabel>
                      <Input
                        {...field}
                        id="invite-member-email"
                        type="email"
                        aria-invalid={fieldState.invalid}
                        placeholder="membro@exemplo.com"
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
                  name="role"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="invite-member-role">
                        Função
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                        disabled={form.formState.isSubmitting}
                      >
                        <SelectTrigger
                          id="invite-member-role"
                          className="w-full"
                        >
                          <SelectValue placeholder="Selecione uma função">
                            {getRoleLabel(field.value)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Membro</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>

            <DialogFooter>
              <DialogClose
                render={
                  <Button
                    variant="secondary"
                    disabled={form.formState.isSubmitting}
                    className="w-full sm:w-1/2"
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
                Enviar convite
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;
