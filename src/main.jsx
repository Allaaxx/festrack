import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router';

import { DashboardLayout } from '@/components/layout';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthContextProvider } from '@/contexts/auth';
import EventPage from '@/pages/event';
import EventDetailPage from '@/pages/event-detail';
import NotFoundPage from '@/pages/not-found';
import SettingsPage from '@/pages/settings';
import SignInPage from '@/pages/signin';
import SignUpPage from '@/pages/signup';

import FinancePage from './pages/finance';

const queryClient = new QueryClient();

const LegacyEventDetailRedirect = () => {
  const { eventId } = useParams();
  return <Navigate to={`/events/${eventId}`} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas sem sidebar */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Layout principal da aplicação (rotas autenticadas) */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/finances" replace />} />
        <Route path="/finances" element={<FinancePage />} />
        <Route path="/events" element={<EventPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route
          path="/events/card"
          element={<Navigate to="/events" replace />}
        />
        <Route
          path="/events/calendar"
          element={<Navigate to="/events" replace />}
        />
        {/* Redirecionamentos de retrocompatibilidade para rotas legadas no singular */}
        <Route path="/event" element={<Navigate to="/events" replace />} />
        <Route path="/event/:eventId" element={<LegacyEventDetailRedirect />} />
        <Route path="/event/card" element={<Navigate to="/events" replace />} />
        <Route
          path="/event/calendar"
          element={<Navigate to="/events" replace />}
        />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthContextProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthContextProvider>
        </TooltipProvider>

        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>
  );
}

export default { AppRoutes };
