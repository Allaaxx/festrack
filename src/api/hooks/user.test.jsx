import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAccountsQueryKey,
  useGetAccounts,
  useUnlinkAccount,
  useUpdateProfile,
  useUploadAvatar,
} from '@/api/hooks/user';
import { UserService } from '@/api/services/user';
import { useAuthContext } from '@/contexts/auth';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/api/services/user', () => ({
  UserService: {
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    getAccounts: vi.fn(),
    unlinkAccount: vi.fn(),
  },
}));

describe('useUpdateProfile', () => {
  let queryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls UserService.updateProfile and resolves with updated user', async () => {
    const mockUpdatedUser = {
      id: 'u1',
      firstName: 'Ana',
      lastName: 'Silva',
    };

    UserService.updateProfile.mockResolvedValue(mockUpdatedUser);

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ firstName: 'Ana', lastName: 'Silva' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(UserService.updateProfile).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Silva',
    });
    expect(result.current.data).toEqual(mockUpdatedUser);
  });
});

describe('useUploadAvatar', () => {
  let queryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls UserService.uploadAvatar and resolves with updated user', async () => {
    const mockFile = new File(['test'], 'avatar.png', { type: 'image/png' });
    const mockUpdatedUser = {
      id: 'u1',
      image: 'https://s3.amazonaws.com/festrack/avatars/user-1.png',
    };

    UserService.uploadAvatar.mockResolvedValue(mockUpdatedUser);

    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockFile);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(UserService.uploadAvatar).toHaveBeenCalledWith(mockFile);
    expect(result.current.data).toEqual(mockUpdatedUser);
  });
});

describe('useGetAccounts', () => {
  let queryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({
      user: { id: 'u1', name: 'Ana' },
    });
  });

  it('calls UserService.getAccounts and returns connected accounts', async () => {
    const mockAccounts = [
      { id: 'acc-1', providerId: 'google' },
      { id: 'acc-2', providerId: 'credential' },
    ];
    UserService.getAccounts.mockResolvedValue(mockAccounts);

    const { result } = renderHook(() => useGetAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(UserService.getAccounts).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockAccounts);
  });
});

describe('useUnlinkAccount', () => {
  let queryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({
      user: { id: 'u1', name: 'Ana' },
    });
  });

  it('calls UserService.unlinkAccount and invalidates getAccounts query on success', async () => {
    UserService.unlinkAccount.mockResolvedValue({ success: true });

    const wrapper = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnlinkAccount(), {
      wrapper,
    });

    result.current.mutate({ providerId: 'google' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(UserService.unlinkAccount).toHaveBeenCalledWith({
      providerId: 'google',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: getAccountsQueryKey({ userId: 'u1' }),
    });
  });
});
