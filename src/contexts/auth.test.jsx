import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { AuthContextProvider, useAuthContext } from '@/contexts/auth';

const mockUseSession = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockSignInMutateAsync = vi.fn();
const mockSignUpMutateAsync = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => mockUseSession(),
    signOut: () => mockSignOut(),
    getSession: () => mockGetSession(),
  },
}));

vi.mock('@/api/hooks/auth', () => ({
  useSignIn: () => ({
    mutateAsync: mockSignInMutateAsync,
  }),
  useSignUp: () => ({
    mutateAsync: mockSignUpMutateAsync,
  }),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('AuthContext', () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    vi.spyOn(queryClient, 'clear');
  });

  const createWrapper = () => {
    return ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <AuthContextProvider>{children}</AuthContextProvider>
      </QueryClientProvider>
    );
  };

  it('reflects initializing state when session is pending', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isInitializing).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('normalizes and provides user when session is established', async () => {
    mockUseSession.mockReturnValue({
      data: {
        session: { id: 's1' },
        user: {
          id: 'u1',
          name: 'Maria Silva',
          first_name: 'Maria',
          last_name: 'Silva',
          email: 'maria@example.com',
        },
      },
      isPending: false,
    });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
      expect(result.current.user).toEqual({
        id: 'u1',
        name: 'Maria Silva',
        first_name: 'Maria',
        last_name: 'Silva',
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@example.com',
      });
    });
  });

  it('signin calls signInMutation, updates user, and shows success toast', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    const mockLoggedUser = {
      id: 'u2',
      name: 'Carlos Lima',
      firstName: 'Carlos',
      lastName: 'Lima',
      first_name: 'Carlos',
      last_name: 'Lima',
      email: 'carlos@example.com',
    };

    mockSignInMutateAsync.mockResolvedValueOnce(mockLoggedUser);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.signin({
        email: 'carlos@example.com',
        password: 'password123',
      });
    });

    expect(mockSignInMutateAsync).toHaveBeenCalledWith({
      email: 'carlos@example.com',
      password: 'password123',
    });
    expect(result.current.user).toEqual(mockLoggedUser);
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
      })
    );
  });

  it('signin surfaces error toast and re-throws when mutation fails', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    const error = new Error('Invalid email or password');
    mockSignInMutateAsync.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.signin({
        email: 'wrong@example.com',
        password: 'wrong',
      })
    ).rejects.toThrow('Invalid email or password');

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
      })
    );
  });

  it('signup calls signUpMutation, updates user, and shows success toast', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    const mockNewUser = {
      id: 'u3',
      name: 'Ana Costa',
      firstName: 'Ana',
      lastName: 'Costa',
      first_name: 'Ana',
      last_name: 'Costa',
      email: 'ana@example.com',
    };

    mockSignUpMutateAsync.mockResolvedValueOnce(mockNewUser);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.signup({
        firstName: 'Ana',
        lastName: 'Costa',
        email: 'ana@example.com',
        password: 'password123',
      });
    });

    expect(mockSignUpMutateAsync).toHaveBeenCalled();
    expect(result.current.user).toEqual(mockNewUser);
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
      })
    );
  });

  it('signout calls authClient.signOut, clears user and purges QueryClient cache', async () => {
    mockUseSession.mockReturnValue({
      data: {
        session: { id: 's1' },
        user: { id: 'u1', name: 'User', email: 'u@example.com' },
      },
      isPending: false,
    });

    mockSignOut.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.signout();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(queryClient.clear).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('updateUser updates normalized user immediately and triggers getSession', () => {
    mockUseSession.mockReturnValue({
      data: {
        session: { id: 's1' },
        user: { id: 'u1', name: 'User One', email: 'u1@example.com' },
      },
      isPending: false,
    });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateUser({
        id: 'u1',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'u1@example.com',
      });
    });

    expect(result.current.user).toMatchObject({
      id: 'u1',
      firstName: 'Jane',
      lastName: 'Doe',
      first_name: 'Jane',
      last_name: 'Doe',
    });
    expect(mockGetSession).toHaveBeenCalled();
  });
});
