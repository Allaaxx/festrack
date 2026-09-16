import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { DashboardLayout } from '@/components/layout';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthContextProvider } from '@/contexts/auth';
import EventCalendarPage from '@/pages/calendar';
import EventPage from '@/pages/event';
import HomePage from '@/pages/home';
import NotFoundPage from '@/pages/not-found';
import SignInPage from '@/pages/signin';
import SignUpPage from '@/pages/signup';

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas sem sidebar */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Layout principal da aplicação (rotas autenticadas) */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/event" element={<Navigate to="/event/card" replace />} />
        <Route path="/event/card" element={<EventPage />} />
        <Route path="/event/calendar" element={<EventCalendarPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

createRoot(document.getElementById('root')).render(
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

export default { AppRoutes };
