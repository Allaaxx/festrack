import {
  CalendarCogIcon,
  ChartSplineIcon,
  PiggyBankIcon,
} from 'lucide-react';

import {
  NavMain,
  NavUser,
  SearchForm,
  ShopSwitcher,
} from '@/components/layout';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Financeiro',
      url: '/',
      icon: <ChartSplineIcon />,
    },
    {
      title: 'Eventos',
      url: '/event/card',
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

export const AppSidebar = ({ ...props }) => {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <ShopSwitcher />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
