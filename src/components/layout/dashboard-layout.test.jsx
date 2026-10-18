import { render, renderHook, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { useNavMenu } from '@/components/layout/hooks';
import { SidebarProvider } from '@/components/ui/sidebar';
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

  it('renders a single main landmark and an accessible footer with copyright and social links', () => {
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

    const { container } = render(
      <MemoryRouter initialEntries={['/events/ev-123']}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route
              path="/events/:eventId"
              element={<div>Event Detail View</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(container.querySelector('.x')).not.toBeInTheDocument();

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(within(footer).getByText('Festrack')).toBeInTheDocument();
    expect(within(footer).getByText(/Celebre a vida/i)).toBeInTheDocument();

    expect(
      within(footer).getByRole('link', { name: 'Facebook' })
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole('link', { name: 'Instagram' })
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole('link', { name: 'LinkedIn' })
    ).toBeInTheDocument();
  });
});

describe('useNavMenu and AppSidebar nested route active state', () => {
  const navItems = [
    { title: 'Financeiro', url: '/finances' },
    { title: 'Eventos', url: '/events' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Maria Silva',
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@example.com',
      },
      signout: vi.fn(),
    });
  });

  it('marks /events as isActive: true on /events and nested /events/ev-123, and false on /finances', () => {
    const { result: onEventsRoot } = renderHook(() => useNavMenu(navItems), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/events']}>{children}</MemoryRouter>
      ),
    });

    expect(
      onEventsRoot.current.find((item) => item.title === 'Eventos').isActive
    ).toBe(true);
    expect(
      onEventsRoot.current.find((item) => item.title === 'Financeiro').isActive
    ).toBe(false);

    const { result: onNestedEvent } = renderHook(() => useNavMenu(navItems), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/events/ev-123']}>
          {children}
        </MemoryRouter>
      ),
    });

    expect(
      onNestedEvent.current.find((item) => item.title === 'Eventos').isActive
    ).toBe(true);
    expect(
      onNestedEvent.current.find((item) => item.title === 'Financeiro').isActive
    ).toBe(false);

    const { result: onFinances } = renderHook(() => useNavMenu(navItems), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/finances']}>{children}</MemoryRouter>
      ),
    });

    expect(
      onFinances.current.find((item) => item.title === 'Eventos').isActive
    ).toBe(false);
    expect(
      onFinances.current.find((item) => item.title === 'Financeiro').isActive
    ).toBe(true);
  });

  it('highlights Eventos link in AppSidebar on /events/ev-123 and deactivates it on /finances', async () => {
    const { default: ActualAppSidebar } = await vi.importActual(
      '@/components/layout/app-sidebar'
    );

    const { unmount } = render(
      <MemoryRouter initialEntries={['/events/ev-123']}>
        <SidebarProvider>
          <ActualAppSidebar />
        </SidebarProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Eventos' })).toHaveAttribute(
      'data-active'
    );
    expect(
      screen.getByRole('link', { name: 'Financeiro' })
    ).not.toHaveAttribute('data-active');

    unmount();

    render(
      <MemoryRouter initialEntries={['/finances']}>
        <SidebarProvider>
          <ActualAppSidebar />
        </SidebarProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Eventos' })).not.toHaveAttribute(
      'data-active'
    );
    expect(screen.getByRole('link', { name: 'Financeiro' })).toHaveAttribute(
      'data-active'
    );
  });
});
