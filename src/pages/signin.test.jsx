import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import SignInPage from '@/pages/signin';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

describe('SignInPage', () => {
  const mockSignin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading indicator while auth state is initializing', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: true,
      signin: mockSignin,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });

  it('renders sign-in form when unauthenticated', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Entre na sua conta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite seu email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite sua senha')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /fazer login/i })
    ).toBeInTheDocument();
  });

  it('renders brand header with logo and link to home', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    const brandLink = screen.getByRole('link', { name: /festrack/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('renders theme-adaptive cover images in right column', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    const coverImages = screen.getAllByAltText('Festrack');
    expect(coverImages).toHaveLength(2);
    expect(coverImages[0]).toHaveAttribute('src', '/auth-cover-white.jpg');
    expect(coverImages[1]).toHaveAttribute('src', '/auth-cover-black.jpg');
  });

  it('renders registration link pointing to /signup', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    const signupLink = screen.getByRole('link', { name: /crie agora/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('redirects to / when user is already authenticated without location state', () => {
    useAuthContext.mockReturnValue({
      user: { id: 'u1', name: 'John Doe' },
      isInitializing: false,
      signin: mockSignin,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/" element={<div>Dashboard Home</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Home')).toBeInTheDocument();
  });

  it('redirects to preserved destination when user is already authenticated with location state', () => {
    useAuthContext.mockReturnValue({
      user: { id: 'u1', name: 'John Doe' },
      isInitializing: false,
      signin: mockSignin,
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/signin',
            state: { from: { pathname: '/event', search: '?view=month' } },
          },
        ]}
      >
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/event" element={<div>Event Calendar Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Event Calendar Page')).toBeInTheDocument();
  });

  it('submits credentials and calls signin', async () => {
    mockSignin.mockResolvedValueOnce({ id: 'u1', name: 'John' });

    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Digite seu email'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite sua senha'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /fazer login/i }));

    await waitFor(() => {
      expect(mockSignin).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
      });
    });
  });

  it('displays form error when signin fails', async () => {
    mockSignin.mockRejectedValueOnce(new Error('Credenciais inválidas'));

    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Digite seu email'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite sua senha'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /fazer login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Credenciais inválidas/i)).toBeInTheDocument();
    });
  });

  it('renders Google sign-in button and separator', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
      signInWithGoogle: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole('button', { name: /continuar com google/i })
    ).toBeInTheDocument();
    expect(screen.getByText('ou')).toBeInTheDocument();
  });

  it('initiates Google sign-in when Google button is clicked', async () => {
    const mockSignInWithGoogle = vi
      .fn()
      .mockResolvedValueOnce({ url: 'https://accounts.google.com' });

    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
      signInWithGoogle: mockSignInWithGoogle,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    const googleBtn = screen.getByRole('button', {
      name: /continuar com google/i,
    });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledWith({
        callbackURL: '/',
      });
    });
  });

  it('initiates Google sign-in passing preserved location state to callbackURL', async () => {
    const mockSignInWithGoogle = vi
      .fn()
      .mockResolvedValueOnce({ url: 'https://accounts.google.com' });

    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
      signInWithGoogle: mockSignInWithGoogle,
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/signin',
            state: { from: { pathname: '/settings', search: '?tab=conta' } },
          },
        ]}
      >
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    const googleBtn = screen.getByRole('button', {
      name: /continuar com google/i,
    });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledWith({
        callbackURL: '/settings?tab=conta',
      });
    });
  });

  it('displays form error when Google sign-in fails', async () => {
    const mockSignInWithGoogle = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha no Google OAuth'));

    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signin: mockSignin,
      signInWithGoogle: mockSignInWithGoogle,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
        </Routes>
      </MemoryRouter>
    );

    const googleBtn = screen.getByRole('button', {
      name: /continuar com google/i,
    });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Falha no Google OAuth/i)).toBeInTheDocument();
    });
  });

  describe('OAuth error search parameter feedback', () => {
    it('displays localized error alert when redirected with ?error=state_mismatch', () => {
      useAuthContext.mockReturnValue({
        user: null,
        isInitializing: false,
        signin: mockSignin,
        signInWithGoogle: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/signin?error=state_mismatch']}>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
          </Routes>
        </MemoryRouter>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(
        screen.getByText(
          'A sessão de autenticação expirou ou é inválida. Por favor, tente novamente.'
        )
      ).toBeInTheDocument();
    });

    it('displays localized error alert when redirected with ?error=access_denied', () => {
      useAuthContext.mockReturnValue({
        user: null,
        isInitializing: false,
        signin: mockSignin,
        signInWithGoogle: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/signin?error=access_denied']}>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
          </Routes>
        </MemoryRouter>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(
        screen.getByText(
          'O acesso foi negado ou cancelado. Por favor, tente novamente.'
        )
      ).toBeInTheDocument();
    });

    it('displays localized error alert when redirected with ?error=oauth_link_error', () => {
      useAuthContext.mockReturnValue({
        user: null,
        isInitializing: false,
        signin: mockSignin,
        signInWithGoogle: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/signin?error=oauth_link_error']}>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
          </Routes>
        </MemoryRouter>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(
        screen.getByText(
          'Não foi possível vincular a conta do Google. Verifique se o e-mail já está associado a outra conta.'
        )
      ).toBeInTheDocument();
    });

    it('displays error_description when an unmapped error code is provided', () => {
      useAuthContext.mockReturnValue({
        user: null,
        isInitializing: false,
        signin: mockSignin,
        signInWithGoogle: vi.fn(),
      });

      render(
        <MemoryRouter
          initialEntries={[
            '/signin?error=server_error&error_description=Falha+no+servidor+Google',
          ]}
        >
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
          </Routes>
        </MemoryRouter>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Falha no servidor Google')).toBeInTheDocument();
    });
  });
});
