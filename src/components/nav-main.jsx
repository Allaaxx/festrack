'use client';

import { ChevronRightIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function NavMain({ items }) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isCurrentRoute = location.pathname === item.url;
          const to = isCurrentRoute
            ? { pathname: item.url, search: location.search }
            : item.url;

          return (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              render={<SidebarMenuItem />}
            >
              <SidebarMenuButton
                tooltip={item.title}
                render={<Link to={to} />}
                isActive={isCurrentRoute}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <SidebarMenuAction
                    render={<CollapsibleTrigger />}
                    className="aria-expanded:rotate-90"
                  >
                    <ChevronRightIcon />
                    <span className="sr-only">Alternar</span>
                  </SidebarMenuAction>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isSubCurrent = location.pathname === subItem.url;
                        const subTo = isSubCurrent
                          ? { pathname: subItem.url, search: location.search }
                          : subItem.url;

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              render={<Link to={subTo} />}
                              isActive={isSubCurrent}
                            >
                              <span>{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
