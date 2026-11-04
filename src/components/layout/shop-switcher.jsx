'use client';

import { ChevronsUpDown, Plus, SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useShopContext } from '@/contexts/shop';
import CreateShopDialog from '@/features/shops/components/create-shop-dialog';

const ROLE_LABELS = {
  OWNER: 'Proprietário',
  MEMBER: 'Membro',
};

const getRoleLabel = (role) => ROLE_LABELS[role] || '';

const getShopInitial = (name) => {
  if (!name || typeof name !== 'string') return 'L';
  return name.trim().charAt(0).toUpperCase() || 'L';
};

const ShopSwitcher = ({ shops: fallbackShops = [] }) => {
  const { isMobile } = useSidebar();
  const {
    shops: contextShops,
    activeShop: contextActiveShop,
    role,
    setActiveShop,
  } = useShopContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const availableShops =
    Array.isArray(contextShops) && contextShops.length > 0
      ? contextShops
      : fallbackShops;

  const activeShop = contextActiveShop || availableShops[0] || null;

  if (!activeShop) {
    return (
      <>
        {isCreateDialogOpen && (
          <CreateShopDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
        )}
      </>
    );
  }

  const ActiveLogo =
    typeof activeShop.logo === 'function' ? activeShop.logo : null;
  const activeRoleLabel =
    getRoleLabel(activeShop.role ?? role) || activeShop.plan || '';

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold">
                    {ActiveLogo ? (
                      <ActiveLogo className="size-4" />
                    ) : (
                      <span>{getShopInitial(activeShop.name)}</span>
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {activeShop.name}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {activeRoleLabel}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              className="w-(--anchor-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Lojas
                </DropdownMenuLabel>
                {availableShops.map((shop, index) => {
                  const ShopLogo =
                    typeof shop.logo === 'function' ? shop.logo : null;
                  const shopRoleLabel =
                    getRoleLabel(shop.role) || shop.plan || '';
                  return (
                    <DropdownMenuItem
                      key={shop.id || shop.name}
                      onClick={() => setActiveShop(shop)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-xs border text-xs font-medium">
                        {ShopLogo ? (
                          <ShopLogo className="size-4 shrink-0" />
                        ) : (
                          <span>{getShopInitial(shop.name)}</span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col leading-tight">
                        <span className="truncate font-medium">
                          {shop.name}
                        </span>
                        {shopRoleLabel && (
                          <span className="text-muted-foreground text-xs">
                            {shopRoleLabel}
                          </span>
                        )}
                      </div>
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  render={<Link to="/settings?tab=loja" />}
                  className="gap-2 p-2"
                >
                  <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <SettingsIcon className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Configurações da Loja
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="gap-2 p-2"
                >
                  <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Adicionar Loja
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {isCreateDialogOpen && (
        <CreateShopDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      )}
    </>
  );
};

export default ShopSwitcher;
