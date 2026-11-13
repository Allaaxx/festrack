import { PanelLeftIcon } from 'lucide-react';
import { Fragment } from 'react';
import { Link, useLocation } from 'react-router';

import { LogoIcon } from '@/assets/images';
import { ModeToggle } from '@/components/layout/mode-toggle';
import SearchForm from '@/components/layout/search-form';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';

const getBreadcrumbs = (pathname) => {
  if (pathname.startsWith('/events/')) {
    return [
      { label: 'Eventos', to: '/events' },
      { label: 'Detalhes do Evento' },
    ];
  }

  if (pathname.startsWith('/events')) {
    return [{ label: 'Eventos' }];
  }

  if (pathname.startsWith('/finances')) {
    return [{ label: 'Finanças' }];
  }

  if (pathname.startsWith('/catalog')) {
    return [{ label: 'Catálogo' }];
  }

  if (pathname.startsWith('/settings')) {
    return [{ label: 'Configurações' }];
  }

  return [];
};

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-3 px-4">
        <LogoIcon className="h-5 w-5" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-5 data-vertical:self-auto"
        />
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <PanelLeftIcon />
        </Button>

        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              {breadcrumbs.length > 0 ? (
                <BreadcrumbLink render={<Link to="/" />}>
                  Festrack
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>Festrack</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={crumb.label}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast || !crumb.to ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link to={crumb.to} />}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm
          label="Pesquise aqui"
          placeholder="Pesquise aqui"
          className="w-full sm:ml-auto sm:w-auto"
        />
        <ModeToggle />
      </div>
    </header>
  );
};

export default Header;
