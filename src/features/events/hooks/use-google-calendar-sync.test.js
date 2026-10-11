import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetAccounts, useUpdateUser } from '@/api/hooks/user';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useGoogleCalendarSync } from '@/features/events/hooks/use-google-calendar-sync';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/api/hooks/user', () => ({
  useGetAccounts: vi.fn(),
  useUpdateUser: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('useGoogleCalendarSync', () => {
  const mockLinkSocial = vi.fn();
  const mockUpdateUserMutateAsync = vi.fn();
  const mockUser = {
    id: 'u1',
    name: 'Allan',
    google_calendar_sync_enabled: false,
    googleCalendarSyncEnabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthContext.mockReturnValue({
      user: mockUser,
      linkSocial: mockLinkSocial,
    });
    useUpdateUser.mockReturnValue({
      mutateAsync: mockUpdateUserMutateAsync,
      isPending: false,
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

  it('derives isSyncEnabled reactively from user profile and linked account', () => {
    useAuthContext.mockReturnValue({
      user: { ...mockUser, google_calendar_sync_enabled: true },
      linkSocial: mockLinkSocial,
    });
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-google', providerId: 'google' }],
      isLoading: false,
    });

    const { result } = renderHook(() => useGoogleCalendarSync());

    expect(result.current.isGoogleConnected).toBe(true);
    expect(result.current.isSyncEnabled).toBe(true);
  });

  it('keeps isSyncEnabled false if user setting is enabled but Google is not linked', () => {
    useAuthContext.mockReturnValue({
      user: { ...mockUser, google_calendar_sync_enabled: true },
      linkSocial: mockLinkSocial,
    });
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
    expect(mockUpdateUserMutateAsync).not.toHaveBeenCalled();
  });

  it('persists sync preference to server via useUpdateUser when Google is already connected', async () => {
    mockUpdateUserMutateAsync.mockResolvedValueOnce({
      ...mockUser,
      google_calendar_sync_enabled: true,
    });
    useGetAccounts.mockReturnValue({
      data: [
        { id: 'acc-1', providerId: 'credential' },
        { id: 'acc-2', providerId: 'google' },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useGoogleCalendarSync());

    expect(result.current.isGoogleConnected).toBe(true);

    await act(async () => {
      await result.current.enableSync();
    });

    expect(mockUpdateUserMutateAsync).toHaveBeenCalledWith({
      google_calendar_sync_enabled: true,
    });
    expect(mockLinkSocial).not.toHaveBeenCalled();
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: expect.stringMatching(/sincronização ativada/i),
      })
    );
  });

  it('allows disabling sync at any time and persists change to server', async () => {
    mockUpdateUserMutateAsync.mockResolvedValueOnce({
      ...mockUser,
      google_calendar_sync_enabled: false,
    });
    useAuthContext.mockReturnValue({
      user: { ...mockUser, google_calendar_sync_enabled: true },
      linkSocial: mockLinkSocial,
    });
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-1', providerId: 'google' }],
      isLoading: false,
    });

    const { result } = renderHook(() => useGoogleCalendarSync());
    expect(result.current.isSyncEnabled).toBe(true);

    await act(async () => {
      await result.current.disableSync();
    });

    expect(mockUpdateUserMutateAsync).toHaveBeenCalledWith({
      google_calendar_sync_enabled: false,
    });
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/sincronização desativada/i),
      })
    );
  });

  it('surfaces error toast if server update fails when toggling sync', async () => {
    mockUpdateUserMutateAsync.mockRejectedValueOnce(
      new Error('Erro de conexão com o servidor')
    );
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-google', providerId: 'google' }],
      isLoading: false,
    });

    const { result } = renderHook(() => useGoogleCalendarSync());

    await act(async () => {
      await result.current.toggleSync();
    });

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: expect.stringMatching(/erro na sincronização/i),
      })
    );
  });
});
