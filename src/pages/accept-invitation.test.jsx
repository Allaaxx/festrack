import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LOCAL_STORAGE_ACTIVE_SHOP_KEY } from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import { ShopContextProvider, useShopContext } from '@/contexts/shop';
import { ShopService } from '@/features/shops';
import AcceptInvitationPage from '@/pages/accept-invitation';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/features/shops/api/services', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getInvitationByToken: vi.fn(),
    acceptInvitation: vi.fn(),
  },
}));

const AuthDestinationProbe = ({ label }) => {
  const location = useLocation();
  const fromPath =
    typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname;

  return (
    <div>
      <span>{label}</span>
      {fromPath && <span data-testid="redirect-from">{fromPath}</span>}
    </div>
  );
};

const FinancesDashboardProbe = () => {
  const { activeShop } = useShopContext();
  return (
    <div>
      <span>Finances Dashboard</span>
      {activeShop && (
        <span data-testid="active-shop-name">{activeShop.name}</span>
      )}
    </div>
  );
};

describe('AcceptInvitationPage (/invite/:token)', () => {
  let queryClient;

  const validInvitation = {
    id: 'inv-1',
    shop_id: 'shop-10',
    shop: {
      id: 'shop-10',
      name: 'Atelier Festas Imperiais',
      description: 'Eventos corporativos e casamentos',
    },
    email: 'convidado@example.com',
    role: 'MEMBER',
    status: 'PENDING',
    expires_at: '2099-12-31T23:59:59.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    ShopService.getAll.mockResolvedValue([]);
  });

  const renderInviteRoute = (initialEntry = '/invite/tok-123') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ShopContextProvider>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path="/invite/:token" element={<AcceptInvitationPage />} />
              <Route
                path="/signin"
                element={<AuthDestinationProbe label="SignIn Page" />}
              />
              <Route
                path="/signup"
                element={<AuthDestinationProbe label="SignUp Page" />}
              />
              <Route path="/finances" element={<FinancesDashboardProbe />} />
              <Route path="/" element={<div>Home Page</div>} />
            </Routes>
          </MemoryRouter>
        </ShopContextProvider>
      </QueryClientProvider>
    );
  };

  it('displays shop invitation details and prompts unauthenticated visitors to sign in or sign up preserving redirect destination', async () => {
    const user = userEvent.setup();
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signout: vi.fn(),
    });
    ShopService.getInvitationByToken.mockResolvedValue(validInvitation);

    renderInviteRoute('/invite/tok-123');

    await waitFor(() => {
      expect(screen.getByText('Atelier Festas Imperiais')).toBeInTheDocument();
    });

    expect(ShopService.getInvitationByToken).toHaveBeenCalledWith('tok-123');
    expect(screen.getByText('convidado@example.com')).toBeInTheDocument();
    expect(screen.getByText('Membro')).toBeInTheDocument();

    const signInButton = screen.getByRole('button', { name: /entrar/i });
    const signUpButton = screen.getByRole('button', { name: /criar conta/i });
    expect(signInButton).toBeInTheDocument();
    expect(signUpButton).toBeInTheDocument();

    await user.click(signInButton);

    expect(screen.getByText('SignIn Page')).toBeInTheDocument();
    expect(screen.getByTestId('redirect-from')).toHaveTextContent(
      '/invite/tok-123'
    );
  });

  it('preserves redirect destination when unauthenticated visitor clicks Criar conta', async () => {
    const user = userEvent.setup();
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signout: vi.fn(),
    });
    ShopService.getInvitationByToken.mockResolvedValue({
      ...validInvitation,
      role: 'OWNER',
      shop: undefined,
      shop_name: 'Buffet Estrela',
    });

    renderInviteRoute('/invite/tok-owner');

    await waitFor(() => {
      expect(screen.getByText('Buffet Estrela')).toBeInTheDocument();
    });

    expect(screen.getByText('Proprietário')).toBeInTheDocument();

    const signUpButton = screen.getByRole('button', { name: /criar conta/i });
    await user.click(signUpButton);

    expect(screen.getByText('SignUp Page')).toBeInTheDocument();
    expect(screen.getByTestId('redirect-from')).toHaveTextContent(
      '/invite/tok-owner'
    );
  });

  it('allows an authenticated user with matching email to accept the invitation, activates the joined shop, and navigates to /finances', async () => {
    const user = userEvent.setup();
    useAuthContext.mockReturnValue({
      user: {
        id: 'user-2',
        name: 'Convidado Silva',
        email: 'CONVIDADO@example.com',
      },
      isInitializing: false,
      signout: vi.fn(),
    });
    ShopService.getAll.mockResolvedValue([
      {
        id: 'shop-1',
        name: 'Minha Loja Antiga',
        description: null,
        role: 'OWNER',
      },
    ]);
    ShopService.getInvitationByToken.mockResolvedValue(validInvitation);
    ShopService.acceptInvitation.mockResolvedValue({
      id: 'member-10',
      shop_id: 'shop-10',
      user_id: 'user-2',
      role: 'MEMBER',
    });

    renderInviteRoute('/invite/tok-123');

    const acceptButton = await screen.findByRole('button', {
      name: /aceitar convite/i,
    });
    expect(acceptButton).toBeEnabled();

    await user.click(acceptButton);

    await waitFor(() => {
      expect(ShopService.acceptInvitation).toHaveBeenCalledWith('tok-123');
      expect(screen.getByText('Finances Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByTestId('active-shop-name')).toHaveTextContent(
      'Atelier Festas Imperiais'
    );
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-10');
  });

  it('displays an error alert if accepting the invitation fails on the server', async () => {
    const user = userEvent.setup();
    useAuthContext.mockReturnValue({
      user: {
        id: 'user-2',
        name: 'Convidado Silva',
        email: 'convidado@example.com',
      },
      isInitializing: false,
      signout: vi.fn(),
    });
    ShopService.getInvitationByToken.mockResolvedValue(validInvitation);
    ShopService.acceptInvitation.mockRejectedValue({
      response: {
        status: 400,
        data: { message: 'Este convite já foi utilizado ou expirou.' },
      },
    });

    renderInviteRoute('/invite/tok-123');

    const acceptButton = await screen.findByRole('button', {
      name: /aceitar convite/i,
    });
    await user.click(acceptButton);

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(
      /este convite já foi utilizado ou expirou/i
    );
  });

  it('displays an email mismatch warning banner and allows switching accounts when authenticated with a different email', async () => {
    const user = userEvent.setup();
    const mockSignout = vi.fn().mockResolvedValue(undefined);
    useAuthContext.mockReturnValue({
      user: {
        id: 'user-other',
        name: 'Outro Usuário',
        email: 'outro@example.com',
      },
      isInitializing: false,
      signout: mockSignout,
    });
    ShopService.getInvitationByToken.mockResolvedValue(validInvitation);

    renderInviteRoute('/invite/tok-123');

    const mismatchAlert = await screen.findByRole('alert');
    expect(mismatchAlert).toHaveTextContent(/convidado@example\.com/i);
    expect(mismatchAlert).toHaveTextContent(/outro@example\.com/i);

    expect(
      screen.queryByRole('button', { name: /aceitar convite/i })
    ).not.toBeInTheDocument();

    const switchAccountButton = screen.getByRole('button', {
      name: /trocar de conta/i,
    });
    await user.click(switchAccountButton);

    await waitFor(() => {
      expect(mockSignout).toHaveBeenCalledTimes(1);
      expect(screen.getByText('SignIn Page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('redirect-from')).toHaveTextContent(
      '/invite/tok-123'
    );
  });

  it('displays an invalid or expired error state when the invitation token is not found (404)', async () => {
    const user = userEvent.setup();
    useAuthContext.mockReturnValue({
      user: {
        id: 'user-2',
        name: 'Convidado Silva',
        email: 'convidado@example.com',
      },
      isInitializing: false,
      signout: vi.fn(),
    });
    ShopService.getInvitationByToken.mockRejectedValue({
      response: { status: 404, data: { message: 'Invitation not found' } },
    });

    renderInviteRoute('/invite/invalid-tok');

    expect(
      await screen.findByText(/convite inválido ou expirado/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /aceitar convite/i })
    ).not.toBeInTheDocument();

    const homeButton = screen.getByRole('button', {
      name: /voltar para o início/i,
    });
    await user.click(homeButton);

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('displays an invalid or expired error state when the invitation status is EXPIRED or REVOKED or expires_at is in the past', async () => {
    useAuthContext.mockReturnValue({
      user: {
        id: 'user-2',
        name: 'Convidado Silva',
        email: 'convidado@example.com',
      },
      isInitializing: false,
      signout: vi.fn(),
    });
    ShopService.getInvitationByToken.mockResolvedValue({
      ...validInvitation,
      status: 'REVOKED',
    });

    const { unmount } = renderInviteRoute('/invite/revoked-tok');

    expect(
      await screen.findByText(/convite inválido ou expirado/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /aceitar convite/i })
    ).not.toBeInTheDocument();

    unmount();

    ShopService.getInvitationByToken.mockResolvedValue({
      ...validInvitation,
      status: 'PENDING',
      expires_at: '2020-01-01T00:00:00.000Z',
    });

    renderInviteRoute('/invite/expired-date-tok');

    expect(
      await screen.findByText(/convite inválido ou expirado/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /aceitar convite/i })
    ).not.toBeInTheDocument();
  });
});
