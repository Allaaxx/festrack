import { PlusIcon, XIcon } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

const initialAccounts = [
  {
    id: 'google',
    name: 'Google',
    iconUrl:
      'https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png',
  },
  {
    id: 'slack',
    name: 'Slack',
    iconUrl: 'https://cdn.shadcnstudio.com/ss-assets/brand-logo/slack-icon.png',
  },
];

const ConnectedAccountsCard = () => {
  const [connectedAccounts, setConnectedAccounts] = useState(initialAccounts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [appName, setAppName] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [appIconUrl, setAppIconUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleRemoveAccount = (accountId, name) => {
    setConnectedAccounts((prev) =>
      prev.filter((account) => account.id !== accountId)
    );
    toast.add({
      type: 'success',
      title: 'Conta desconectada',
      description: `${name} foi desconectado com sucesso.`,
    });
  };

  const resetForm = () => {
    setAppName('');
    setAppUrl('');
    setAppIconUrl('');
    setDescription('');
  };

  const handleConnect = () => {
    if (!appName.trim() || !appUrl.trim()) return;

    const id = appName.toLowerCase().replace(/\s+/g, '-');

    setConnectedAccounts((prev) => [
      ...prev,
      {
        id,
        name: appName,
        iconUrl: appIconUrl.trim() || '',
      },
    ]);

    toast.add({
      type: 'success',
      title: 'Aplicativo conectado',
      description: `${appName} foi integrado à sua conta.`,
    });

    resetForm();
    setIsDialogOpen(false);
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">Contas Conectadas</h3>
        <p className="text-muted-foreground text-sm">
          Gerencie suas integrações e serviços de terceiros vinculados.
        </p>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-4">
          {connectedAccounts.map((account) => (
            <div
              key={account.id}
              className="flex h-9 w-fit items-center gap-2 rounded-md border px-2.5 text-sm"
            >
              {account.iconUrl ? (
                <img
                  src={account.iconUrl}
                  alt={account.name}
                  className="size-4 rounded"
                />
              ) : (
                <div className="bg-muted-foreground/10 text-muted-foreground flex size-4 items-center justify-center rounded text-xs font-medium">
                  {account.name.charAt(0)}
                </div>
              )}

              <p className="text-sm font-medium">{account.name}</p>
              <Button
                size="icon-xs"
                variant="ghost"
                className="text-primary bg-primary/10 size-5 shrink-0 rounded-md transition-colors"
                aria-label={`Remover ${account.name}`}
                onClick={() => handleRemoveAccount(account.id, account.name)}
              >
                <XIcon className="size-3" aria-hidden="true" />
              </Button>
            </div>
          ))}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="h-9 gap-2 rounded-md px-3"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <PlusIcon className="size-4" />
                  Conectar aplicativo
                </Button>
              }
            />

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conectar novo aplicativo</DialogTitle>
                <DialogDescription>
                  Adicione uma nova integração fornecendo as informações abaixo.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 py-2">
                <div className="grid gap-1">
                  <Label htmlFor="app-name">Nome do aplicativo</Label>
                  <Input
                    id="app-name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Ex: Google Drive, Notion..."
                  />
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="app-url">URL ou chave de integração</Label>
                  <Input
                    id="app-url"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://app.exemplo.com ou chave_api"
                  />
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="app-desc">Descrição (opcional)</Label>
                  <Input
                    id="app-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notas ou objetivo desta integração"
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose
                  render={
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  }
                />
                <Button
                  onClick={handleConnect}
                  disabled={!appName.trim() || !appUrl.trim()}
                >
                  Conectar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-muted-foreground text-sm">
          Contas conectadas permitem sincronização automática com serviços
          externos.
        </p>
      </div>
    </div>
  );
};

export default ConnectedAccountsCard;
