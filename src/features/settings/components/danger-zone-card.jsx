import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const DangerZoneCard = () => {
  const [open, setOpen] = useState(false);

  const handleDeleteAccount = () => {
    toast.add({
      type: 'error',
      title: 'Ação não disponível',
      description:
        'Entre em contato com o suporte para solicitar a exclusão da sua conta.',
    });
    setOpen(false);
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">Zona de Perigo</h3>
        <p className="text-muted-foreground text-sm">
          Exclua sua conta permanentemente. Esta ação removerá todos os seus
          dados e não poderá ser desfeita.
        </p>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Excluir conta</h4>
                <p className="text-muted-foreground text-sm">
                  Exclua sua conta permanentemente. Esta ação removerá todas as
                  suas transações, eventos e saldos cadastrados.
                </p>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      className="border-destructive! text-destructive! hover:bg-destructive/10! focus-visible:ring-destructive/20 shrink-0 max-lg:w-full"
                    >
                      <Trash2Icon className="size-4" />
                      Excluir conta
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader className="space-y-2">
                    <DialogTitle className="text-destructive">
                      Tem certeza que deseja excluir sua conta?
                    </DialogTitle>
                    <DialogDescription>
                      Esta ação é permanente e não poderá ser desfeita. Todos os
                      seus dados financeiros serão excluídos imediatamente.
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter className="gap-2 sm:justify-end">
                    <DialogClose
                      render={<Button variant="outline">Cancelar</Button>}
                    />
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Sim, excluir minha conta
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DangerZoneCard;
