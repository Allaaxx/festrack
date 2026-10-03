import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
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

  it('renders null while auth state is initializing', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: true,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('redirects unauthenticated user to /signin', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/signin" element={<div>Sign In Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
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
