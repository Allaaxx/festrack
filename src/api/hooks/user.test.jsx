import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateProfile, useUploadAvatar } from '@/api/hooks/user';
import { UserService } from '@/api/services/user';

vi.mock('@/api/services/user', () => ({
  UserService: {
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
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
