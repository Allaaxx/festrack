'use client';

import { ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';

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

const NavMainItem = ({ item, LinkComponent }) => {
  const [isOpen, setIsOpen] = useState(Boolean(item.isActive));
  const [prevIsActive, setPrevIsActive] = useState(Boolean(item.isActive));

  if (Boolean(item.isActive) !== prevIsActive) {
    setPrevIsActive(Boolean(item.isActive));
    setIsOpen(Boolean(item.isActive));
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      render={<SidebarMenuItem />}
    >
      <SidebarMenuButton
        tooltip={item.title}
        render={
          item.items?.length ? (
            <CollapsibleTrigger className="cursor-pointer" />
          ) : (
            <LinkComponent to={item.url} href={item.url} />
          )
        }
        isActive={item.isActive}
      >
        {item.icon}
        <span>{item.title}</span>
      </SidebarMenuButton>

      {item.items?.length ? (
        <>
          <SidebarMenuAction
            render={<CollapsibleTrigger className="cursor-pointer" />}
            className="aria-expanded:rotate-90"
          >
            <ChevronRightIcon />
            <span className="sr-only">Alternar</span>
          </SidebarMenuAction>
          <CollapsibleContent className="mt-1.5">
            <SidebarMenuSub>
              {item.items?.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    render={
                      <LinkComponent to={subItem.url} href={subItem.url} />
                    }
                    isActive={subItem.isActive}
                  >
                    <span>{subItem.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </>
      ) : null}
    </Collapsible>
  );
};

const NavMain = ({ items = [], LinkComponent = 'a' }) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {items.map((item) => (
          <NavMainItem
            key={item.title}
            item={item}
            LinkComponent={LinkComponent}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default NavMain;
