import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useShopContext } from '@/contexts/shop';
import DeleteShopDialog from '@/features/shops/components/delete-shop-dialog';
import LeaveShopDialog from '@/features/shops/components/leave-shop-dialog';
import TransferOwnershipDialog from '@/features/shops/components/transfer-ownership-dialog';

const ShopDangerZoneCard = () => {
  const { activeShop, role } = useShopContext();
  const isOwner = (activeShop?.role ?? role) === 'OWNER';

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">Zona de Perigo</h3>
        <p className="text-muted-foreground text-sm">
          Ações críticas e irreversíveis relacionadas à administração e
          permanência nesta loja.
        </p>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-6">
            {isOwner ? (
              <>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">
                      Transferir posse da loja
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Transfira a propriedade administrativa desta loja para
                      outro membro ativo.
                    </p>
                  </div>

                  <TransferOwnershipDialog />
                </div>

                <Separator />

                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Excluir loja</h4>
                    <p className="text-muted-foreground text-sm">
                      Exclua esta loja permanentemente. Todos os eventos,
                      transações e membros associados serão removidos.
                    </p>
                  </div>

                  <DeleteShopDialog />
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Sair da loja</h4>
                  <p className="text-muted-foreground text-sm">
                    Encerre sua participação nesta loja. Você perderá o acesso
                    aos registros compartilhados imediatamente.
                  </p>
                </div>

                <LeaveShopDialog />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopDangerZoneCard;
