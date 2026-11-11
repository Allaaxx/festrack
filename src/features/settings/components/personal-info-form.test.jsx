import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateProfile, useUploadAvatar } from '@/api/hooks/user';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import PersonalInfoForm from '@/features/settings/components/personal-info-form';

const mockUpdateProfileMutateAsync = vi.fn();
const mockUploadAvatarMutateAsync = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/api/hooks/user', () => ({
  useUpdateProfile: vi.fn(),
  useUploadAvatar: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('PersonalInfoForm Component', () => {
  const mockUser = {
    id: 'u1',
    name: 'Ana Silva',
    firstName: 'Ana',
    lastName: 'Silva',
    first_name: 'Ana',
    last_name: 'Silva',
    email: 'ana@example.com',
    image: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((file) => `blob:http://localhost/${file.name}`),
      revokeObjectURL: vi.fn(),
    });
    useAuthContext.mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
    });
    useUpdateProfile.mockReturnValue({
      mutateAsync: mockUpdateProfileMutateAsync,
      isPending: false,
    });
    useUploadAvatar.mockReturnValue({
      mutateAsync: mockUploadAvatarMutateAsync,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly populates first name and last name from normalized user', () => {
    render(<PersonalInfoForm />);

    const firstNameInput = screen.getByLabelText('Nome');
    const lastNameInput = screen.getByLabelText('Sobrenome');

    expect(firstNameInput).toHaveValue('Ana');
    expect(lastNameInput).toHaveValue('Silva');
  });

  it('renders existing remote avatar when user has image', () => {
    useAuthContext.mockReturnValue({
      user: {
        ...mockUser,
        image: 'https://s3.amazonaws.com/festrack/avatars/user-1.png',
      },
      updateUser: mockUpdateUser,
    });

    render(<PersonalInfoForm />);

    const avatarImg = screen.getByAltText('Avatar do usuário');
    expect(avatarImg).toHaveAttribute(
      'src',
      'https://s3.amazonaws.com/festrack/avatars/user-1.png'
    );
  });

  it('submits updated names, calls updateUser, and triggers success toast', async () => {
    const updatedUser = {
      ...mockUser,
      firstName: 'Beatriz',
      lastName: 'Costa',
      name: 'Beatriz Costa',
    };
    mockUpdateProfileMutateAsync.mockResolvedValueOnce(updatedUser);

    render(<PersonalInfoForm />);

    const firstNameInput = screen.getByLabelText('Nome');
    const lastNameInput = screen.getByLabelText('Sobrenome');
    const submitBtn = screen.getByRole('button', {
      name: /salvar alterações/i,
    });

    fireEvent.change(firstNameInput, { target: { value: 'Beatriz' } });
    fireEvent.change(lastNameInput, { target: { value: 'Costa' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateProfileMutateAsync).toHaveBeenCalledWith({
        firstName: 'Beatriz',
        lastName: 'Costa',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Informações salvas com sucesso!',
        })
      );
    });
  });

  it('shows error toast when profile update fails', async () => {
    mockUpdateProfileMutateAsync.mockRejectedValueOnce(
      new Error('Erro na conexão')
    );

    render(<PersonalInfoForm />);

    const firstNameInput = screen.getByLabelText('Nome');
    const submitBtn = screen.getByRole('button', {
      name: /salvar alterações/i,
    });

    fireEvent.change(firstNameInput, { target: { value: 'Beatriz' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Erro ao atualizar perfil',
        })
      );
    });
  });

  it('renders loading state and disables submit button when mutation is pending', () => {
    useUpdateProfile.mockReturnValue({
      mutateAsync: mockUpdateProfileMutateAsync,
      isPending: true,
    });

    render(<PersonalInfoForm />);

    const submitBtn = screen.getByRole('button', { name: /salvando/i });
    expect(submitBtn).toBeDisabled();
  });

  describe('Avatar upload via Dropzone', () => {
    it('renders empty dropzone state when user has no existing avatar image', () => {
      render(<PersonalInfoForm />);

      expect(
        screen.getByText('Arraste e solte seu arquivo aqui')
      ).toBeInTheDocument();
      expect(
        screen.getByText('ou clique para navegar no computador')
      ).toBeInTheDocument();
    });

    it('uploads valid file immediately and updates user on success', async () => {
      const validFile = new File(['image-bytes'], 'avatar.webp', {
        type: 'image/webp',
      });
      const updatedUser = {
        ...mockUser,
        image: 'https://s3.amazonaws.com/festrack/avatars/user-1-new.webp',
      };
      mockUploadAvatarMutateAsync.mockResolvedValueOnce(updatedUser);

      const { container } = render(<PersonalInfoForm />);
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(mockUploadAvatarMutateAsync).toHaveBeenCalledWith(validFile);
        expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'Avatar atualizado com sucesso!',
          })
        );
      });
    });

    it('shows error toast and resets preview when avatar upload mutation fails', async () => {
      const validFile = new File(['image-bytes'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      mockUploadAvatarMutateAsync.mockRejectedValueOnce(
        new Error('Falha no upload')
      );

      const { container } = render(<PersonalInfoForm />);
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Erro ao enviar avatar',
          })
        );
      });

      // Verify broken file does not remain stuck in the preview
      expect(screen.queryByText('avatar.jpg')).not.toBeInTheDocument();
      expect(
        screen.getByText('Arraste e solte seu arquivo aqui')
      ).toBeInTheDocument();
    });

    it('restores previous avatar image when new avatar upload fails', async () => {
      useAuthContext.mockReturnValue({
        user: {
          ...mockUser,
          image: 'https://s3.amazonaws.com/festrack/avatars/user-1.png',
        },
        updateUser: mockUpdateUser,
      });

      const validFile = new File(['image-bytes'], 'new-avatar.jpg', {
        type: 'image/jpeg',
      });
      mockUploadAvatarMutateAsync.mockRejectedValueOnce(
        new Error('Falha no upload')
      );

      const { container } = render(<PersonalInfoForm />);
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Erro ao enviar avatar',
          })
        );
      });

      expect(screen.queryByText('new-avatar.jpg')).not.toBeInTheDocument();
      const restoredImg = screen.getByAltText('Avatar do usuário');
      expect(restoredImg).toHaveAttribute(
        'src',
        'https://s3.amazonaws.com/festrack/avatars/user-1.png'
      );
    });

    it('shows validation error toast when selected file exceeds 5MB', async () => {
      const { container } = render(<PersonalInfoForm />);
      const fileInput = container.querySelector('input[type="file"]');

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Arquivo inválido',
            description: expect.stringContaining(
              'excede o tamanho máximo de 5 MB'
            ),
          })
        );
      });
      expect(mockUploadAvatarMutateAsync).not.toHaveBeenCalled();
    });

    it('shows validation error toast when selected file has unsupported MIME type', async () => {
      const { container } = render(<PersonalInfoForm />);
      const fileInput = container.querySelector('input[type="file"]');

      const pdfFile = new File(['pdf-content'], 'doc.pdf', {
        type: 'application/pdf',
      });

      fireEvent.change(fileInput, { target: { files: [pdfFile] } });

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Arquivo inválido',
            description: expect.stringContaining('Formato não suportado'),
          })
        );
      });
      expect(mockUploadAvatarMutateAsync).not.toHaveBeenCalled();
    });

    it('renders loading spinner and disables dropzone controls when avatar upload is pending in empty state', () => {
      useUploadAvatar.mockReturnValue({
        mutateAsync: mockUploadAvatarMutateAsync,
        isPending: true,
      });

      const { container } = render(<PersonalInfoForm />);

      expect(
        screen.getByTestId('dropzone-loading-spinner')
      ).toBeInTheDocument();
      expect(screen.getByText('Enviando arquivo...')).toBeInTheDocument();

      const dropzone = container.querySelector('[data-slot="dropzone-zone"]');
      expect(dropzone).toHaveAttribute('data-disabled');
    });

    it('renders loading indicator and disables action buttons when user has avatar and upload is pending', () => {
      useAuthContext.mockReturnValue({
        user: {
          ...mockUser,
          image: 'https://s3.amazonaws.com/festrack/avatars/user-1.png',
        },
        updateUser: mockUpdateUser,
      });
      useUploadAvatar.mockReturnValue({
        mutateAsync: mockUploadAvatarMutateAsync,
        isPending: true,
      });

      render(<PersonalInfoForm />);

      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      expect(
        screen.getByTestId('dropzone-loading-spinner')
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /substituir/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /remover/i })
      ).not.toBeInTheDocument();
    });
  });
});
