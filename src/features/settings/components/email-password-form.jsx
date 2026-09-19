import { CheckIcon, EyeIcon, EyeOffIcon, MailIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
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

const EmailPasswordForm = () => {
  const { user } = useAuthContext();
  const [email, setEmail] = useState(user?.email ?? '');
  const [prevUser, setPrevUser] = useState(user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  if (user !== prevUser) {
    setPrevUser(user);
    setEmail(user?.email ?? '');
  }

  const toggleVisibility = () => setIsVisible((prev) => !prev);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.add({
      type: 'success',
      title: 'Configurações de segurança atualizadas!',
      description: 'Seu e-mail e/ou senha foram salvos com sucesso.',
    });
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">E-mail e Senha</h3>
        <p className="text-muted-foreground text-sm">
          Gerencie seu endereço de e-mail e credenciais de acesso.
        </p>
      </div>

      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="mx-auto space-y-6">
          <div className="w-full space-y-2">
            <Label htmlFor="email" className="gap-1">
              E-mail<span className="text-destructive">*</span>
            </Label>
            <InputGroup>
              <InputGroupInput
                id="email"
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

          <div className="w-full space-y-2">
            <Label htmlFor="current-password" className="gap-1">
              Senha atual<span className="text-destructive">*</span>
            </Label>
            <InputGroup>
              <InputGroupInput
                id="current-password"
                type={isVisible ? 'text' : 'password'}
                placeholder="Digite sua senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <InputGroupAddon align="inline-end" className="pr-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleVisibility}
                  className="text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent"
                >
                  {isVisible ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                  <span className="sr-only">
                    {isVisible ? 'Ocultar senha' : 'Exibir senha'}
                  </span>
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="new-password" className="gap-1">
              Nova senha<span className="text-destructive">*</span>
            </Label>
            <InputGroup className="mb-3">
              <InputGroupInput
                id="new-password"
                type={isVisible ? 'text' : 'password'}
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <InputGroupAddon align="inline-end" className="pr-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleVisibility}
                  className="text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent"
                >
                  {isVisible ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                  <span className="sr-only">
                    {isVisible ? 'Ocultar senha' : 'Exibir senha'}
                  </span>
                </Button>
              </InputGroupAddon>
            </InputGroup>

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
            <Button type="submit" className="max-sm:w-full">
              Salvar alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailPasswordForm;
