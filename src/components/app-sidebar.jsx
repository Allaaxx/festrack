import { CalendarCogIcon, ChartSplineIcon, Store } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuthContext } from '@/contexts/auth';

import { ShopSwitcher } from './shop-switcher';

const data = {
  shops: [
    {
      name: 'Loja padrão',
      logo: Store,
      plan: 'Empresa',
    },
  ],
  navMain: [
    {
      title: 'Financeiro',
      url: '/',
      icon: <ChartSplineIcon />,
      isActive: true,
    },
    {
      title: 'Eventos',
      url: '/event',
      icon: <CalendarCogIcon />,
    },
  ],
};
export function AppSidebar({ ...props }) {
  const { user, signout } = useAuthContext();
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <ShopSwitcher shops={data.shops} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} signout={signout} />
      </SidebarFooter>
    </Sidebar>
  );
}
