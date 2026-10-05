import { AlertCircleIcon, KeyRoundIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';

import { useGetAccounts, useUnlinkAccount } from '@/api/hooks/user';
import GoogleIcon from '@/components/shared/google-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useGoogleCalendarSync } from '@/features/events';

const ConnectedAccountsCard = () => {
  const { linkSocial } = useAuthContext();
  const { data: accounts = [], isLoading } = useGetAccounts();
  const unlinkAccountMutation = useUnlinkAccount();
  const {
    isSyncEnabled,
    toggleSync,
    isConnecting: isSyncConnecting,
  } = useGoogleCalendarSync();

  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);

  const hasGoogle = accounts.some((acc) => acc.providerId === 'google');
  const hasCredential = accounts.some((acc) => acc.providerId === 'credential');
  const isSoleMethod = accounts.length <= 1;

  const handleConnectGoogle = async () => {
    try {
      setIsConnectingGoogle(true);
      await linkSocial({
        provider: 'google',
        callbackURL: window.location.href,
      });
      toast.add({
        type: 'success',
        title: 'Conta do Google conectada!',
        description: 'Sua conta Google foi vinculada com sucesso.',
      });
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Erro ao conectar conta',
        description:
          error?.message || 'Não foi possível vincular sua conta do Google.',
      });
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleConfirmUnlink = async () => {
    try {
      await unlinkAccountMutation.mutateAsync({ providerId: 'google' });
      toast.add({
        type: 'success',
        title: 'Conta desconectada com sucesso!',
        description: 'Sua conta do Google foi desvinculada.',
      });
      setUnlinkDialogOpen(false);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Não foi possível desconectar a conta do Google.';
      toast.add({
        type: 'error',
        title: 'Erro ao desconectar conta',
        description: errorMsg,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">Contas Conectadas</h3>
        <p className="text-muted-foreground text-sm">
          Gerencie suas integrações e serviços de terceiros vinculados.
        </p>
      </div>

      <div className="space-y-6 lg:col-span-2">
        {isLoading ? (
          <div data-testid="accounts-skeleton" className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Account Card */}
            <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted/40 flex size-9 items-center justify-center rounded-md border">
                  <GoogleIcon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Google</p>
                  <p className="text-muted-foreground text-xs">
                    {hasGoogle
                      ? 'Conta Google conectada para autenticação e sincronização.'
                      : 'Conecte sua conta Google para login rápido e calendário.'}
                  </p>
                </div>
              </div>

              <div>
                {hasGoogle ? (
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSoleMethod || unlinkAccountMutation.isPending}
                      aria-label="Desconectar Google"
                      onClick={() => setUnlinkDialogOpen(true)}
                    >
                      {unlinkAccountMutation.isPending && (
                        <Loader2Icon className="animate-spin" />
                      )}
                      Desconectar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={isConnectingGoogle}
                    onClick={handleConnectGoogle}
                    aria-label="Conectar Google"
                  >
                    {isConnectingGoogle ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    Conectar Google
                  </Button>
                )}
              </div>
            </div>

            {hasGoogle && isSoleMethod && (
              <div className="flex items-center gap-2 rounded-md bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircleIcon className="size-4 shrink-0" />
                <p>
                  Este é o seu único método de login. Cadastre uma senha antes
                  de desconectar para não perder o acesso à sua conta.
                </p>
              </div>
            )}

            {/* Email/Password Account Card */}
            {hasCredential && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-muted/40 flex size-9 items-center justify-center rounded-md border">
                    <KeyRoundIcon className="text-muted-foreground size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">E-mail e Senha</p>
                    <p className="text-muted-foreground text-xs">
                      Login tradicional via credenciais seguras.
                    </p>
                  </div>
                </div>
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Ativo
                </span>
              </div>
            )}

            <Separator className="my-6" />

            {/* Google Calendar Synchronization */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium">
                  Sincronização com Google Agenda
                </p>
                <p className="text-muted-foreground text-xs">
                  Exporte seus eventos do Festrack automaticamente para seu
                  Google Agenda.
                </p>
              </div>
              <Switch
                checked={isSyncEnabled}
                onCheckedChange={toggleSync}
                disabled={isSyncConnecting}
                aria-label="Sincronizar com Google Agenda"
              />
            </div>
          </div>
        )}
      </div>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconectar conta do Google</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja desconectar sua conta do Google? Você
              não poderá mais usá-la para fazer login no Festrack.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setUnlinkDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmUnlink}
              disabled={unlinkAccountMutation.isPending}
              aria-label="Confirmar desconexão"
            >
              {unlinkAccountMutation.isPending && (
                <Loader2Icon className="animate-spin" />
              )}
              Confirmar desconexão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectedAccountsCard;
