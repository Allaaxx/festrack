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

  it('redirects to / when user is already authenticated', () => {
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
});
