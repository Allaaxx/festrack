import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSignIn, useSignUp } from '@/api/hooks/auth';
import { AuthService } from '@/api/services/auth';

vi.mock('@/api/services/auth', () => ({
  AuthService: {
    signup: vi.fn(),
    signin: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Auth Hooks', () => {
  it('useSignUp invokes AuthService.signup and resolves with user data', async () => {
    const mockUser = { id: 'u1', name: 'User 1' };
    AuthService.signup.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useSignUp(), {
      wrapper: createWrapper(),
    });

    const promise = result.current.mutateAsync({
      firstName: 'User',
      lastName: '1',
      email: 'u1@example.com',
      password: 'password123',
    });

    await expect(promise).resolves.toEqual(mockUser);
    expect(AuthService.signup).toHaveBeenCalledWith({
      firstName: 'User',
      lastName: '1',
      email: 'u1@example.com',
      password: 'password123',
    });
  });

  it('useSignUp propagates errors from AuthService.signup', async () => {
    const error = new Error('Signup failed');
    AuthService.signup.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSignUp(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        firstName: 'User',
        lastName: '1',
        email: 'u1@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('Signup failed');
  });

  it('useSignIn invokes AuthService.signin and resolves with user data', async () => {
    const mockUser = { id: 'u1', name: 'User 1' };
    AuthService.signin.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useSignIn(), {
      wrapper: createWrapper(),
    });

    const promise = result.current.mutateAsync({
      email: 'u1@example.com',
      password: 'password123',
    });

    await expect(promise).resolves.toEqual(mockUser);
    expect(AuthService.signin).toHaveBeenCalledWith({
      email: 'u1@example.com',
      password: 'password123',
    });
  });

  it('useSignIn propagates errors from AuthService.signin', async () => {
    const error = new Error('Invalid credentials');
    AuthService.signin.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSignIn(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        email: 'u1@example.com',
        password: 'wrong',
      })
    ).rejects.toThrow('Invalid credentials');
  });
});
