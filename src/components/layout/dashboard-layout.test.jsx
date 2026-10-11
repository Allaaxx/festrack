import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuthContext } from '@/contexts/auth';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

// Mock child layout components to isolate route protection seam
vi.mock('@/components/layout/app-sidebar', () => ({
  default: () => <div data-testid="app-sidebar">Sidebar</div>,
}));

vi.mock('@/components/layout/header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

describe('DashboardLayout Route Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading indicator while auth state is initializing', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });

  it('redirects unauthenticated user to /signin preserving location in state', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
    });

    let capturedLocation;
    const SignInCapture = () => {
      const location = useLocation();
      capturedLocation = location;
      return <div>Sign In Page</div>;
    };

    render(
      <MemoryRouter initialEntries={['/settings?tab=conta']}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/settings" element={<div>Settings Page</div>} />
          </Route>
          <Route path="/signin" element={<SignInCapture />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
    expect(screen.queryByText('Settings Page')).not.toBeInTheDocument();
    expect(capturedLocation.state?.from).toMatchObject({
      pathname: '/settings',
      search: '?tab=conta',
    });
  });

  it('renders layout and protected outlet when user is authenticated', () => {
    useAuthContext.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Maria Silva',
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@example.com',
      },
      isInitializing: false,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
