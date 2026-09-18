import { CalendarCogIcon, ChartSplineIcon, Store } from 'lucide-react';

import NavMain from '@/components/layout/nav-main';
import NavUser from '@/components/layout/nav-user';
import ShopSwitcher from '@/components/layout/shop-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuthContext } from '@/contexts/auth';

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
    },
    {
      title: 'Eventos',
      url: '#',
      icon: <CalendarCogIcon />,
      items: [
        {
          title: 'Lista de eventos',
          url: '/event/card',
        },
        {
          title: 'Calendário de eventos',
          url: '/event/calendar',
        },
      ],
    },
  ],
};

const AppSidebar = ({ ...props }) => {
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
};

export default AppSidebar;
