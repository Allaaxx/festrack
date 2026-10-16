import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import SignUpPage from '@/pages/signup';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

describe('SignUpPage', () => {
  const mockSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading indicator while auth state is initializing', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: true,
      signup: mockSignup,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });

  it('renders sign-up form when unauthenticated', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signup: mockSignup,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Criar uma conta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite seu nome')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Digite seu sobrenome')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite seu email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite sua senha')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Digite sua senha novamente')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /criar conta/i })
    ).toBeInTheDocument();
  });

  it('renders brand header with logo and link to home', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signup: mockSignup,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
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
      signup: mockSignup,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    const coverImages = screen.getAllByAltText('Festrack');
    expect(coverImages).toHaveLength(2);
    expect(coverImages[0]).toHaveAttribute('src', '/auth-cover-white.jpg');
    expect(coverImages[1]).toHaveAttribute('src', '/auth-cover-black.jpg');
  });

  it('renders login link pointing to /signin', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signup: mockSignup,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    const signinLink = screen.getByRole('link', { name: /faça login/i });
    expect(signinLink).toBeInTheDocument();
    expect(signinLink).toHaveAttribute('href', '/signin');
  });

  it('redirects to / when user is already authenticated without location state', () => {
    useAuthContext.mockReturnValue({
      user: { id: 'u1', name: 'John Doe' },
      isInitializing: false,
      signup: mockSignup,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
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
      signup: mockSignup,
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/signup',
            state: { from: { pathname: '/event', search: '?view=week' } },
          },
        ]}
      >
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/event" element={<div>Event Calendar Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Event Calendar Page')).toBeInTheDocument();
  });

  it('submits registration form with terms accepted and calls signup', async () => {
    mockSignup.mockResolvedValueOnce({ id: 'u1', name: 'John' });

    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signup: mockSignup,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Digite seu nome'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite seu sobrenome'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite seu email'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite sua senha'), {
      target: { value: 'password123' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Digite sua senha novamente'),
      {
        target: { value: 'password123' },
      }
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          passwordConfirmation: 'password123',
          terms: true,
        })
      );
    });
  });

  it('displays error when email already in use', async () => {
    mockSignup.mockRejectedValueOnce(
      new Error('Este email já está sendo utilizado')
    );

    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signup: mockSignup,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Digite seu nome'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite seu sobrenome'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite seu email'), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Digite sua senha'), {
      target: { value: 'password123' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Digite sua senha novamente'),
      {
        target: { value: 'password123' },
      }
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Este e-mail já está em uso/i)
      ).toBeInTheDocument();
    });
  });

  it('renders Google sign-up button and separator', () => {
    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signup: mockSignup,
      signInWithGoogle: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
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
      signup: mockSignup,
      signInWithGoogle: mockSignInWithGoogle,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
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
      signup: mockSignup,
      signInWithGoogle: mockSignInWithGoogle,
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/signup',
            state: { from: { pathname: '/event', search: '?view=calendar' } },
          },
        ]}
      >
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    const googleBtn = screen.getByRole('button', {
      name: /continuar com google/i,
    });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledWith({
        callbackURL: '/event?view=calendar',
      });
    });
  });

  it('displays form error when Google sign-up fails', async () => {
    const mockSignInWithGoogle = vi
      .fn()
      .mockRejectedValueOnce(new Error('Erro no cadastro via Google'));

    useAuthContext.mockReturnValue({
      user: null,
      isInitializing: false,
      signup: mockSignup,
      signInWithGoogle: mockSignInWithGoogle,
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
        </Routes>
      </MemoryRouter>
    );

    const googleBtn = screen.getByRole('button', {
      name: /continuar com google/i,
    });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Erro no cadastro via Google/i)
      ).toBeInTheDocument();
    });
  });
});
