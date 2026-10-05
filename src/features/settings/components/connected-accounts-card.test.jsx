import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetAccounts, useUnlinkAccount } from '@/api/hooks/user';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import ConnectedAccountsCard from '@/features/settings/components/connected-accounts-card';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/api/hooks/user', () => ({
  useGetAccounts: vi.fn(),
  useUnlinkAccount: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('ConnectedAccountsCard Component', () => {
  const mockLinkSocial = vi.fn();
  const mockUnlinkMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthContext.mockReturnValue({
      user: { id: 'u1', name: 'Allan' },
      linkSocial: mockLinkSocial,
    });
    useUnlinkAccount.mockReturnValue({
      mutateAsync: mockUnlinkMutateAsync,
      isPending: false,
    });
  });

  it('renders loading skeleton while accounts are loading', () => {
    useGetAccounts.mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(<ConnectedAccountsCard />);

    expect(screen.getByTestId('accounts-skeleton')).toBeInTheDocument();
  });

  it('renders connected accounts and "Conectar Google" when Google is not linked', () => {
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-1', providerId: 'credential' }],
      isLoading: false,
    });

    render(<ConnectedAccountsCard />);

    expect(screen.getByText('Contas Conectadas')).toBeInTheDocument();
    expect(screen.getByText('E-mail e Senha')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /conectar google/i })
    ).toBeInTheDocument();
  });

  it('calls linkSocial when "Conectar Google" is clicked', async () => {
    mockLinkSocial.mockResolvedValueOnce({
      url: 'https://accounts.google.com',
    });
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-1', providerId: 'credential' }],
      isLoading: false,
    });

    render(<ConnectedAccountsCard />);

    const connectBtn = screen.getByRole('button', { name: /conectar google/i });
    fireEvent.click(connectBtn);

    await waitFor(() => {
      expect(mockLinkSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
        })
      );
    });
  });

  it('prevents or warns user when attempting to unlink sole login method', async () => {
    useGetAccounts.mockReturnValue({
      data: [{ id: 'acc-google', providerId: 'google' }],
      isLoading: false,
    });

    render(<ConnectedAccountsCard />);

    const unlinkBtn = screen.getByRole('button', {
      name: /desconectar google/i,
    });
    expect(unlinkBtn).toBeDisabled();
    expect(screen.getByText(/único método de login/i)).toBeInTheDocument();
  });

  it('unlinks Google account with confirmation when multiple accounts exist', async () => {
    mockUnlinkMutateAsync.mockResolvedValueOnce({ success: true });
    useGetAccounts.mockReturnValue({
      data: [
        { id: 'acc-cred', providerId: 'credential' },
        { id: 'acc-google', providerId: 'google' },
      ],
      isLoading: false,
    });

    render(<ConnectedAccountsCard />);

    const unlinkBtn = screen.getByRole('button', {
      name: /desconectar google/i,
    });
    expect(unlinkBtn).not.toBeDisabled();
    fireEvent.click(unlinkBtn);

    // Confirmation dialog appears
    expect(
      screen.getByText(/desconectar conta do google/i)
    ).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', {
      name: /confirmar desconexão/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockUnlinkMutateAsync).toHaveBeenCalledWith({
        providerId: 'google',
      });
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: expect.stringMatching(/conta desconectada/i),
        })
      );
    });
  });

  it('displays error toast when unlinking fails', async () => {
    mockUnlinkMutateAsync.mockRejectedValueOnce(new Error('Erro no servidor'));
    useGetAccounts.mockReturnValue({
      data: [
        { id: 'acc-cred', providerId: 'credential' },
        { id: 'acc-google', providerId: 'google' },
      ],
      isLoading: false,
    });

    render(<ConnectedAccountsCard />);

    const unlinkBtn = screen.getByRole('button', {
      name: /desconectar google/i,
    });
    fireEvent.click(unlinkBtn);

    const confirmBtn = screen.getByRole('button', {
      name: /confirmar desconexão/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: expect.stringMatching(/erro ao desconectar/i),
        })
      );
    });
  });
});
