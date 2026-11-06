import {
  AlertCircleIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  XIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { useChangePassword, useSetPassword } from '@/api/hooks/auth';
import { useGetAccounts } from '@/api/hooks/user';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const requirements = [
  { regex: /.{12,}/, text: 'Pelo menos 12 caracteres' },
  { regex: /[a-z]/, text: 'Pelo menos 1 letra minúscula' },
  { regex: /[A-Z]/, text: 'Pelo menos 1 letra maiúscula' },
  { regex: /[0-9]/, text: 'Pelo menos 1 número' },
  {
    regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    text: 'Pelo menos 1 caractere especial',
  },
];

const PasswordInputField = ({
  id,
  value,
  onChange,
  placeholder,
  className,
  ariaLabelToggle,
  required = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={id}
        type={isVisible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      <InputGroupAddon align="inline-end" className="pr-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsVisible((prev) => !prev)}
          className="text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent"
          aria-label={
            isVisible
              ? `Ocultar ${ariaLabelToggle}`
              : `Exibir ${ariaLabelToggle}`
          }
        >
          {isVisible ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
};

const PasswordForm = () => {
  const { data: accounts = [], isLoading } = useGetAccounts();
  const setPasswordMutation = useSetPassword();
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const hasCredential = accounts.some((acc) => acc.providerId === 'credential');
  const isPending =
    setPasswordMutation.isPending || changePasswordMutation.isPending;

  const strength = requirements.map((req) => ({
    met: req.regex.test(newPassword),
    text: req.text,
  }));

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  const getColor = (score) => {
    if (score === 0) return 'bg-border';
    if (score <= 1) return 'bg-destructive';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-amber-500';
    if (score === 4) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const getText = (score) => {
    if (score === 0) return 'Digite uma senha';
    if (score <= 2) return 'Senha fraca';
    if (score <= 3) return 'Senha média';
    if (score === 4) return 'Senha forte';
    return 'Senha muito forte';
  };

  const isFormValid = hasCredential
    ? currentPassword.length > 0 && strengthScore === requirements.length
    : strengthScore === requirements.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isPending) return;

    try {
      if (!hasCredential) {
        await setPasswordMutation.mutateAsync({ newPassword });
        toast.add({
          type: 'success',
          title: 'Senha cadastrada com sucesso!',
          description:
            'Agora você pode fazer login utilizando também seu e-mail e senha.',
        });
        setNewPassword('');
      } else {
        await changePasswordMutation.mutateAsync({
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        });
        toast.add({
          type: 'success',
          title: 'Senha alterada com sucesso!',
          description: 'Sua senha de acesso foi atualizada.',
        });
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Não foi possível atualizar sua senha. Verifique os dados e tente novamente.';
      toast.add({
        type: 'error',
        title: hasCredential
          ? 'Erro ao alterar senha'
          : 'Erro ao cadastrar senha',
        description: errorMsg,
      });
    }
  };

  if (isLoading) {
    return (
      <div
        data-testid="password-form-skeleton"
        className="grid grid-cols-1 gap-10 lg:grid-cols-3"
      >
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">
          {hasCredential ? 'Alterar Senha' : 'Definir Senha'}
        </h3>
        <p className="text-muted-foreground text-sm">
          {hasCredential
            ? 'Gerencie suas credenciais de segurança e altere sua senha de acesso.'
            : 'Crie uma senha de acesso para poder entrar com e-mail e senha.'}
        </p>
      </div>

      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="mx-auto space-y-6">
          {!hasCredential && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
              <AlertCircleIcon className="mt-0.5 size-5 shrink-0" />
              <div className="space-y-1 text-xs">
                <p className="text-sm font-medium">
                  Sua conta não possui senha cadastrada
                </p>
                <p>
                  Você se conectou utilizando uma conta externa (Google). Defina
                  uma senha abaixo para habilitar o login direto com e-mail e
                  senha e ter independência de acesso.
                </p>
              </div>
            </div>
          )}

          {hasCredential && (
            <div className="w-full space-y-2">
              <Label htmlFor="current-password" className="gap-1">
                Senha atual<span className="text-destructive">*</span>
              </Label>
              <PasswordInputField
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                ariaLabelToggle="senha atual"
              />
            </div>
          )}

          <div className="w-full space-y-2">
            <Label htmlFor="new-password" className="gap-1">
              {hasCredential ? 'Nova senha' : 'Senha'}
              <span className="text-destructive">*</span>
            </Label>
            <PasswordInputField
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={
                hasCredential
                  ? 'Digite a nova senha'
                  : 'Digite uma senha segura'
              }
              className="mb-3"
              ariaLabelToggle="nova senha"
            />

            <div className="mb-4 flex h-1 w-full gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    'h-full flex-1 rounded-full transition-all duration-500 ease-out',
                    index < strengthScore
                      ? getColor(strengthScore)
                      : 'bg-border'
                  )}
                />
              ))}
            </div>

            <p className="text-foreground text-sm font-medium">
              {getText(strengthScore)}. Requisitos:
            </p>

            <ul className="mb-4 space-y-1.5">
              {strength.map((req, index) => (
                <li key={index} className="flex items-center gap-2">
                  {req.met ? (
                    <CheckIcon className="size-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XIcon className="text-muted-foreground size-4" />
                  )}
                  <span
                    className={cn(
                      'text-xs',
                      req.met
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    )}
                  >
                    {req.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isFormValid || isPending}
              className="gap-2 max-sm:w-full"
            >
              {isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <KeyRoundIcon className="size-4" />
              )}
              {hasCredential ? 'Alterar senha' : 'Cadastrar senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordForm;
