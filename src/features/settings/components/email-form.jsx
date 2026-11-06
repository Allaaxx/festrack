import { Loader2Icon, MailIcon } from 'lucide-react';
import { useState } from 'react';

import { useUpdateUser } from '@/api/hooks/user';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';

const EmailForm = () => {
  const { user } = useAuthContext();
  const updateUserMutation = useUpdateUser();
  const [email, setEmail] = useState(user?.email ?? '');
  const [prevUser, setPrevUser] = useState(user);

  if (user !== prevUser) {
    setPrevUser(user);
    setEmail(user?.email ?? '');
  }

  const isUnchanged = email.trim() === (user?.email ?? '').trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUnchanged) return;

    try {
      await updateUserMutation.mutateAsync({ email: email.trim() });
      toast.add({
        type: 'success',
        title: 'E-mail atualizado com sucesso!',
        description: 'Seu endereço de e-mail foi atualizado.',
      });
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Erro ao atualizar e-mail',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Não foi possível atualizar seu e-mail.',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">Endereço de E-mail</h3>
        <p className="text-muted-foreground text-sm">
          Gerencie o endereço de e-mail associado à sua conta.
        </p>
      </div>

      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="mx-auto space-y-6">
          <div className="w-full space-y-2">
            <Label htmlFor="account-email" className="gap-1">
              E-mail<span className="text-destructive">*</span>
            </Label>
            <InputGroup>
              <InputGroupInput
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
              />
              <InputGroupAddon align="inline-end" className="pr-2.5">
                <MailIcon className="size-4" />
                <span className="sr-only">E-mail</span>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isUnchanged || updateUserMutation.isPending}
              className="max-sm:w-full"
            >
              {updateUserMutation.isPending && (
                <Loader2Icon className="animate-spin" />
              )}
              Salvar e-mail
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailForm;
