import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChangePassword, useSetPassword } from '@/api/hooks/auth';
import { useGetAccounts } from '@/api/hooks/user';
import { toast } from '@/components/ui/toast';
import PasswordForm from '@/features/settings/components/password-form';

vi.mock('@/api/hooks/user', () => ({
  useGetAccounts: vi.fn(),
}));

vi.mock('@/api/hooks/auth', () => ({
  useSetPassword: vi.fn(),
  useChangePassword: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('PasswordForm Component', () => {
  const mockSetPasswordMutateAsync = vi.fn();
  const mockChangePasswordMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useSetPassword.mockReturnValue({
      mutateAsync: mockSetPasswordMutateAsync,
      isPending: false,
    });
    useChangePassword.mockReturnValue({
      mutateAsync: mockChangePasswordMutateAsync,
      isPending: false,
    });
  });

  it('renders loading skeleton while accounts query is loading', () => {
    useGetAccounts.mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(<PasswordForm />);

    expect(screen.getByTestId('password-form-skeleton')).toBeInTheDocument();
  });

  describe('When user does not have a credential account (Google auth only)', () => {
    beforeEach(() => {
      useGetAccounts.mockReturnValue({
        data: [{ id: 'acc-google', providerId: 'google' }],
        isLoading: false,
      });
    });

    it('renders "Definir Senha", shows info alert, and does not render "Senha atual" input', () => {
      render(<PasswordForm />);

      expect(
        screen.getByRole('heading', { name: /definir senha/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/sua conta não possui senha cadastrada/i)
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/senha atual/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/^senha/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cadastrar senha/i })
      ).toBeInTheDocument();
    });

    it('disables submit button until password satisfies all 5 strength requirements', () => {
      render(<PasswordForm />);

      const passwordInput = screen.getByLabelText(/^senha/i);
      const submitBtn = screen.getByRole('button', {
        name: /cadastrar senha/i,
      });

      // Initially empty
      expect(submitBtn).toBeDisabled();

      // Weak password
      fireEvent.change(passwordInput, { target: { value: 'short1' } });
      expect(submitBtn).toBeDisabled();

      // Satisfying all: 12+ chars, lowercase, uppercase, number, special char
      fireEvent.change(passwordInput, {
        target: { value: 'Valid@Password123' },
      });
      expect(submitBtn).not.toBeDisabled();
    });

    it('calls setPassword mutation and displays success toast upon valid submit', async () => {
      mockSetPasswordMutateAsync.mockResolvedValueOnce({ success: true });

      render(<PasswordForm />);

      const passwordInput = screen.getByLabelText(/^senha/i);
      fireEvent.change(passwordInput, { target: { value: 'Secure#Pass1234' } });

      const submitBtn = screen.getByRole('button', {
        name: /cadastrar senha/i,
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSetPasswordMutateAsync).toHaveBeenCalledWith({
          newPassword: 'Secure#Pass1234',
        });
      });

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Senha cadastrada com sucesso!',
        })
      );
      expect(passwordInput).toHaveValue('');
    });

    it('displays error toast when setPassword mutation fails', async () => {
      mockSetPasswordMutateAsync.mockRejectedValueOnce(
        new Error('Falha ao definir senha no servidor')
      );

      render(<PasswordForm />);

      const passwordInput = screen.getByLabelText(/^senha/i);
      fireEvent.change(passwordInput, { target: { value: 'Secure#Pass1234' } });

      const submitBtn = screen.getByRole('button', {
        name: /cadastrar senha/i,
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Erro ao cadastrar senha',
            description: 'Falha ao definir senha no servidor',
          })
        );
      });
    });
  });

  describe('When user already has a credential account', () => {
    beforeEach(() => {
      useGetAccounts.mockReturnValue({
        data: [
          { id: 'acc-google', providerId: 'google' },
          { id: 'acc-cred', providerId: 'credential' },
        ],
        isLoading: false,
      });
    });

    it('renders "Alterar Senha", no Google info alert, and both "Senha atual" and "Nova senha" inputs', () => {
      render(<PasswordForm />);

      expect(
        screen.getByRole('heading', { name: /alterar senha/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/sua conta não possui senha cadastrada/i)
      ).not.toBeInTheDocument();
      expect(
        screen.getByLabelText(/^senha atual/i, { selector: 'input' })
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/^nova senha/i, { selector: 'input' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /alterar senha/i })
      ).toBeInTheDocument();
    });

    it('requires both current password and strong new password before enabling submit', () => {
      render(<PasswordForm />);

      const currentInput = screen.getByLabelText(/^senha atual/i, {
        selector: 'input',
      });
      const newInput = screen.getByLabelText(/^nova senha/i, {
        selector: 'input',
      });
      const submitBtn = screen.getByRole('button', { name: /alterar senha/i });

      expect(submitBtn).toBeDisabled();

      // Only strong new password
      fireEvent.change(newInput, { target: { value: 'Valid@Password123' } });
      expect(submitBtn).toBeDisabled();

      // Both filled
      fireEvent.change(currentInput, { target: { value: 'oldPassword123' } });
      expect(submitBtn).not.toBeDisabled();
    });

    it('calls changePassword mutation and shows success toast when submitted', async () => {
      mockChangePasswordMutateAsync.mockResolvedValueOnce({ success: true });

      render(<PasswordForm />);

      const currentInput = screen.getByLabelText(/^senha atual/i, {
        selector: 'input',
      });
      const newInput = screen.getByLabelText(/^nova senha/i, {
        selector: 'input',
      });
      const submitBtn = screen.getByRole('button', { name: /alterar senha/i });

      fireEvent.change(currentInput, { target: { value: 'Current#Pass12' } });
      fireEvent.change(newInput, { target: { value: 'NewSecure#Pass12' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockChangePasswordMutateAsync).toHaveBeenCalledWith({
          currentPassword: 'Current#Pass12',
          newPassword: 'NewSecure#Pass12',
          revokeOtherSessions: false,
        });
      });

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Senha alterada com sucesso!',
        })
      );
      expect(currentInput).toHaveValue('');
      expect(newInput).toHaveValue('');
    });

    it('displays error toast when changePassword mutation fails', async () => {
      mockChangePasswordMutateAsync.mockRejectedValueOnce(
        new Error('Senha atual incorreta')
      );

      render(<PasswordForm />);

      const currentInput = screen.getByLabelText(/^senha atual/i, {
        selector: 'input',
      });
      const newInput = screen.getByLabelText(/^nova senha/i, {
        selector: 'input',
      });
      const submitBtn = screen.getByRole('button', { name: /alterar senha/i });

      fireEvent.change(currentInput, { target: { value: 'WrongPass' } });
      fireEvent.change(newInput, { target: { value: 'NewSecure#Pass12' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Erro ao alterar senha',
            description: 'Senha atual incorreta',
          })
        );
      });
    });

    it('toggles password visibility when visibility buttons are clicked', () => {
      render(<PasswordForm />);

      const currentInput = screen.getByLabelText(/^senha atual/i, {
        selector: 'input',
      });
      const newInput = screen.getByLabelText(/^nova senha/i, {
        selector: 'input',
      });

      expect(currentInput).toHaveAttribute('type', 'password');
      expect(newInput).toHaveAttribute('type', 'password');

      const toggleCurrentBtn = screen.getByRole('button', {
        name: /exibir senha atual/i,
      });
      fireEvent.click(toggleCurrentBtn);
      expect(currentInput).toHaveAttribute('type', 'text');

      const toggleNewBtn = screen.getByRole('button', {
        name: /exibir nova senha/i,
      });
      fireEvent.click(toggleNewBtn);
      expect(newInput).toHaveAttribute('type', 'text');
    });
  });
});
