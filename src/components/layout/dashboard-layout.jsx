import { Navigate, Outlet } from 'react-router';

import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuthContext } from '@/contexts/auth';

const DashboardLayout = () => {
  const { user, isInitializing } = useAuthContext();

  if (isInitializing) return null;

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="[--header-height:calc(--spacing(14))] md:h-svh md:overflow-hidden">
      <SidebarProvider defaultOpen={false} className="flex flex-col">
        <Header />
        <div className="flex flex-1 md:overflow-hidden">
          <AppSidebar />
          <SidebarInset className="md:overflow-y-auto">
            <main className="flex flex-1 flex-col gap-4 p-4">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
