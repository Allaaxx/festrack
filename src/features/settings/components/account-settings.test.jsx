import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetAccounts } from '@/api/hooks/user';
import { useAuthContext } from '@/contexts/auth';
import AccountSettings from '@/features/settings/components/account-settings';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/api/hooks/user', () => ({
  useGetAccounts: vi.fn(),
  useUnlinkAccount: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateUser: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@/api/hooks/auth', () => ({
  useSetPassword: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useChangePassword: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@/features/events', () => ({
  useGoogleCalendarSync: vi.fn(() => ({
    isSyncEnabled: false,
    toggleSync: vi.fn(),
    isConnecting: false,
  })),
}));

describe('AccountSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
    });
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-1', providerId: 'google' }],
      isLoading: false,
    });
  });

  it('renders all account settings sections', () => {
    render(<AccountSettings />);

    // Email section
    expect(
      screen.getByRole('heading', { name: /endereço de e-mail/i })
    ).toBeInTheDocument();

    // Password section (Google only -> Definir Senha)
    expect(
      screen.getByRole('heading', { name: /definir senha/i })
    ).toBeInTheDocument();

    // Connected Accounts section
    expect(
      screen.getByRole('heading', { name: /contas conectadas/i })
    ).toBeInTheDocument();

    // Danger Zone section
    expect(
      screen.getByRole('heading', { name: /zona de perigo/i })
    ).toBeInTheDocument();
  });
});
