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

  it('redirects to / when user is already authenticated', () => {
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
});
