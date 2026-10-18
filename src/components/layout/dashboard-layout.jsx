import { Navigate, Outlet, useLocation } from 'react-router';

import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@/assets/images';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import AuthLoading from '@/components/shared/auth-loading';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuthContext } from '@/contexts/auth';

import { ThemeProvider } from './theme-provider';

const DashboardLayout = () => {
  const { user, isInitializing } = useAuthContext();
  const location = useLocation();

  if (isInitializing) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return (
    <div className="h-svh overflow-hidden [--header-height:calc(--spacing(14))]">
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <SidebarProvider
          defaultOpen={false}
          className="h-full min-h-0 flex-col"
        >
          <Header />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <AppSidebar />
            <SidebarInset className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-1 flex-col gap-4 p-4">
                <Outlet />
              </div>
              <footer>
                <div className="text-muted-foreground flex size-full w-full max-w-11/12 items-center justify-between gap-3 px-4 py-3 max-sm:flex-col sm:gap-6 sm:px-6">
                  <p className="text-sm text-balance max-sm:text-center">
                    {`©${new Date().getFullYear()}`}{' '}
                    <a href="#" className="text-primary">
                      Festrack
                    </a>
                    , Celebre a vida
                  </p>
                  <div className="text-muted-foreground *:hover:text-primary flex items-center gap-5">
                    <a href="#" aria-label="Facebook">
                      <FacebookIcon className="size-4" />
                    </a>
                    <a href="#" aria-label="Instagram">
                      <InstagramIcon className="size-4" />
                    </a>
                    <a href="#" aria-label="LinkedIn">
                      <LinkedinIcon className="size-4" />
                    </a>
                  </div>
                </div>
              </footer>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
};

export default DashboardLayout;
