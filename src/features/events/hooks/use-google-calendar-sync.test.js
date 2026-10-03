import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetAccounts } from '@/api/hooks/user';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useGoogleCalendarSync } from '@/features/events/hooks/use-google-calendar-sync';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/api/hooks/user', () => ({
  useGetAccounts: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('useGoogleCalendarSync', () => {
  const mockLinkSocial = vi.fn();
  const mockUser = { id: 'u1', name: 'Allan' };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthContext.mockReturnValue({
      user: mockUser,
      linkSocial: mockLinkSocial,
    });
  });

  it('initializes with disconnected state when user has no linked Google account', () => {
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-1', providerId: 'credential' }],
      isLoading: false,
    });

    const { result } = renderHook(() => useGoogleCalendarSync());

    expect(result.current.isGoogleConnected).toBe(false);
    expect(result.current.isSyncEnabled).toBe(false);
  });

  it('triggers incremental consent when enabling sync without linked Google account', async () => {
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-1', providerId: 'credential' }],
      isLoading: false,
    });
    mockLinkSocial.mockResolvedValueOnce({
      url: 'https://accounts.google.com',
    });

    const { result } = renderHook(() => useGoogleCalendarSync());

    await act(async () => {
      await result.current.enableSync();
    });

    expect(mockLinkSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
        additionalParams: { access_type: 'offline', prompt: 'consent' },
      })
    );
  });

  it('activates sync without re-authenticating when Google is already connected', async () => {
    useGetAccounts.mockReturnValue({
      data: [
        { id: 'acc-1', providerId: 'credential' },
        { id: 'acc-2', providerId: 'google' },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useGoogleCalendarSync());

    expect(result.current.isGoogleConnected).toBe(true);

    act(() => {
      result.current.enableSync();
    });

    expect(result.current.isSyncEnabled).toBe(true);
    expect(mockLinkSocial).not.toHaveBeenCalled();
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: expect.stringMatching(/sincronização ativada/i),
      })
    );
  });

  it('allows disabling sync at any time', () => {
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-1', providerId: 'google' }],
      isLoading: false,
    });

    const { result } = renderHook(() => useGoogleCalendarSync());

    act(() => {
      result.current.enableSync();
    });
    expect(result.current.isSyncEnabled).toBe(true);

    act(() => {
      result.current.disableSync();
    });
    expect(result.current.isSyncEnabled).toBe(false);
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/sincronização desativada/i),
      })
    );
  });
});
