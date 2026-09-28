import { Navigate, Outlet } from 'react-router';

import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuthContext } from '@/contexts/auth';

import { ThemeProvider } from './theme-provider';

const DashboardLayout = () => {
  const { user, isInitializing } = useAuthContext();

  if (isInitializing) return null;

  if (!user) {
    return <Navigate to="/signin" replace />;
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
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
};

export default DashboardLayout;
