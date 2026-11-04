import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { LOCAL_STORAGE_ACTIVE_SHOP_KEY } from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import { ShopContextProvider, useShopContext } from '@/contexts/shop';
import ShopService from '@/features/shops/api/services';
import CreateShopDialog from '@/features/shops/components/create-shop-dialog';
import SettingsPage from '@/pages/settings';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock('@/features/settings', () => ({
  ProfileSettings: () => <div data-testid="profile-settings">Perfil</div>,
  AccountSettings: () => <div data-testid="account-settings">Conta</div>,
}));

vi.mock('@/features/shops/api/services', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getMembers: vi.fn(),
    removeMember: vi.fn(),
    transferOwnership: vi.fn(),
    getInvitations: vi.fn(),
    createInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
  },
}));

describe('ShopSettings (/settings?tab=loja)', () => {
  let queryClient;

  const ownerShop = {
    id: 'shop-1',
    name: 'Atelier Central',
    description: 'Unidade Matriz',
    role: 'OWNER',
  };

  const memberShop = {
    id: 'shop-2',
    name: 'Buffet Jardim',
    description: 'Filial Sul',
    role: 'MEMBER',
  };

  const mockMembers = [
    {
      id: 'member-1',
      shop_id: 'shop-1',
      user_id: 'user-1',
      role: 'OWNER',
      created_at: '2026-01-10T12:00:00.000Z',
      user: {
        id: 'user-1',
        name: 'Maria Silva',
        first_name: 'Maria',
        last_name: 'Silva',
        email: 'maria@example.com',
        image: null,
      },
    },
    {
      id: 'member-2',
      shop_id: 'shop-1',
      user_id: 'user-2',
      role: 'MEMBER',
      created_at: '2026-01-15T12:00:00.000Z',
      user: {
        id: 'user-2',
        name: 'João Souza',
        first_name: 'João',
        last_name: 'Souza',
        email: 'joao@example.com',
        image: 'https://example.com/joao.png',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useAuthContext.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Maria Silva',
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@example.com',
      },
      isInitializing: false,
    });
    ShopService.getAll.mockResolvedValue([ownerShop, memberShop]);
    ShopService.getMembers.mockResolvedValue(mockMembers);
    ShopService.getInvitations.mockResolvedValue([]);
  });

  const renderSettings = (initialEntry = '/settings?tab=loja') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ShopContextProvider>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </MemoryRouter>
        </ShopContextProvider>
      </QueryClientProvider>
    );
  };

  it('renders the "Loja" tab in /settings?tab=loja and allows OWNER to edit shop name and description', async () => {
    const user = userEvent.setup();
    ShopService.update.mockResolvedValue({
      ...ownerShop,
      name: 'Atelier Central Renovado',
      description: 'Nova descrição da matriz',
    });

    renderSettings('/settings?tab=loja');

    const shopTab = await screen.findByRole('tab', { name: /loja/i });
    expect(shopTab).toHaveAttribute('aria-selected', 'true');

    const nameInput = await screen.findByLabelText(/nome da loja/i);
    const descriptionInput = screen.getByLabelText(/descrição/i);

    await waitFor(() => {
      expect(nameInput).toHaveValue('Atelier Central');
      expect(descriptionInput).toHaveValue('Unidade Matriz');
    });

    expect(nameInput).not.toBeDisabled();
    expect(descriptionInput).not.toBeDisabled();

    await user.clear(nameInput);
    await user.type(nameInput, 'Atelier Central Renovado');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Nova descrição da matriz');

    const saveButton = screen.getByRole('button', {
      name: /salvar alterações/i,
    });
    await user.click(saveButton);

    await waitFor(() => {
      expect(ShopService.update).toHaveBeenCalledWith({
        shopId: 'shop-1',
        name: 'Atelier Central Renovado',
        description: 'Nova descrição da matriz',
      });
    });

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
      })
    );
  });

  it('displays shop name and description as read-only/disabled for MEMBER role', async () => {
    ShopService.getAll.mockResolvedValue([memberShop]);

    renderSettings('/settings?tab=loja');

    const nameInput = await screen.findByLabelText(/nome da loja/i);
    const descriptionInput = screen.getByLabelText(/descrição/i);

    await waitFor(() => {
      expect(nameInput).toHaveValue('Buffet Jardim');
      expect(descriptionInput).toHaveValue('Filial Sul');
    });

    expect(nameInput).toBeDisabled();
    expect(descriptionInput).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: /salvar alterações/i })
    ).not.toBeInTheDocument();
  });

  it('displays active members in a TanStack Table with avatar initials, name, email, role badges, sorting, pagination, and allows OWNER to remove a member with confirmation', async () => {
    const user = userEvent.setup();
    ShopService.removeMember.mockResolvedValue({
      id: 'member-2',
      shop_id: 'shop-1',
      user_id: 'user-2',
      role: 'MEMBER',
    });

    renderSettings('/settings?tab=loja');

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText('MS')).toBeInTheDocument();
    expect(screen.getByText('Proprietário')).toBeInTheDocument();

    expect(screen.getByText('João Souza')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
    expect(
      screen.getByText('Membro', { selector: '[data-slot="badge"]' })
    ).toBeInTheDocument();

    expect(screen.getByText(/página 1 de 1/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /página anterior/i })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /próxima página/i })
    ).toBeDisabled();

    // Sort by Membro column
    const sortMemberBtn = screen.getByRole('button', { name: /^membro$/i });
    await user.click(sortMemberBtn);

    // OWNER can remove another member via confirmation dialog
    const removeMemberButton = screen.getByRole('button', {
      name: /remover joão souza/i,
    });
    await user.click(removeMemberButton);

    expect(
      await screen.findByRole('heading', {
        name: /remover membro/i,
      })
    ).toBeInTheDocument();

    const confirmRemoveButton = screen.getByRole('button', {
      name: /sim, remover membro/i,
    });
    await user.click(confirmRemoveButton);

    await waitFor(() => {
      expect(ShopService.removeMember).toHaveBeenCalledWith({
        shopId: 'shop-1',
        userId: 'user-2',
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('João Souza')).not.toBeInTheDocument();
    });
  });

  it('allows OWNER to invite a member via InviteMemberDialog, copy the generated invite link, view pending invitations with expiration dates, and revoke an invitation', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
      writable: true,
    });

    ShopService.getInvitations.mockResolvedValue([
      {
        id: 'inv-existing',
        shop_id: 'shop-1',
        email: 'ana@example.com',
        role: 'MEMBER',
        token: 'token-existing-123',
        status: 'PENDING',
        expires_at: '2026-02-20T12:00:00.000Z',
      },
    ]);
    ShopService.createInvitation.mockResolvedValue({
      id: 'inv-new',
      shop_id: 'shop-1',
      email: 'carlos@example.com',
      role: 'MEMBER',
      token: 'token-carlos-999',
      status: 'PENDING',
      expires_at: '2026-02-25T12:00:00.000Z',
    });
    ShopService.revokeInvitation.mockResolvedValue({
      id: 'inv-existing',
      shop_id: 'shop-1',
      status: 'REVOKED',
    });

    renderSettings('/settings?tab=loja');

    // Existing pending invitation is displayed with expiration date
    expect(await screen.findByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText(/20\/02\/2026/i)).toBeInTheDocument();

    // Open InviteMemberDialog
    const inviteButton = screen.getByRole('button', {
      name: /convidar membro/i,
    });
    await user.click(inviteButton);

    const emailInput = await screen.findByLabelText(/e-mail/i);
    await user.type(emailInput, 'carlos@example.com');

    const submitInviteButton = screen.getByRole('button', {
      name: /enviar convite|gerar convite/i,
    });
    await user.click(submitInviteButton);

    await waitFor(() => {
      expect(ShopService.createInvitation).toHaveBeenCalledWith({
        shopId: 'shop-1',
        email: 'carlos@example.com',
        role: 'MEMBER',
      });
    });

    // Dialog displays generated link and allows copying or closing
    const linkInput = await screen.findByDisplayValue(
      /\/invite\/token-carlos-999/i
    );
    expect(linkInput).toBeInTheDocument();

    const copyInDialogBtn = screen.getAllByRole('button', {
      name: /copiar link/i,
    })[0];
    await user.click(copyInDialogBtn);
    expect(writeTextSpy).toHaveBeenCalledWith(
      expect.stringContaining('/invite/token-carlos-999')
    );

    const closeDialogBtn = screen.getByRole('button', {
      name: /concluir|fechar/i,
    });
    await user.click(closeDialogBtn);

    // Newly created invitation appears in pending list
    expect(await screen.findByText('carlos@example.com')).toBeInTheDocument();

    // Revoke existing invitation
    const revokeBtn = screen.getByRole('button', {
      name: /revogar convite de ana@example\.com/i,
    });
    await user.click(revokeBtn);

    await waitFor(() => {
      expect(ShopService.revokeInvitation).toHaveBeenCalledWith({
        shopId: 'shop-1',
        invitationId: 'inv-existing',
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
    });
  });

  it('allows OWNER to transfer ownership to another member via TransferOwnershipDialog', async () => {
    const user = userEvent.setup();
    ShopService.transferOwnership.mockResolvedValue({
      id: 'member-2',
      shop_id: 'shop-1',
      user_id: 'user-2',
      role: 'OWNER',
    });

    renderSettings('/settings?tab=loja');

    const transferTriggerBtn = await screen.findByRole('button', {
      name: /transferir posse/i,
    });
    await user.click(transferTriggerBtn);

    expect(
      await screen.findByRole('heading', {
        name: /transferir posse da loja/i,
      })
    ).toBeInTheDocument();

    const memberSelectTrigger = screen.getByLabelText(/novo proprietário/i);
    await user.click(memberSelectTrigger);

    const joaoOption = await screen.findByRole('option', {
      name: /joão souza/i,
    });
    await user.click(joaoOption);

    const confirmTransferBtn = screen.getByRole('button', {
      name: /confirmar transferência/i,
    });
    await user.click(confirmTransferBtn);

    await waitFor(() => {
      expect(ShopService.transferOwnership).toHaveBeenCalledWith({
        shopId: 'shop-1',
        newOwnerUserId: 'user-2',
      });
    });

    // After ownership transfer, user becomes MEMBER and sees "Sair da Loja" in Danger Zone
    expect(
      await screen.findByRole('button', { name: /sair da loja/i })
    ).toBeInTheDocument();
  });

  it('allows OWNER to delete the active shop via DeleteShopDialog and falls back to the next available shop', async () => {
    const user = userEvent.setup();
    ShopService.delete.mockResolvedValue({ id: 'shop-1' });

    renderSettings('/settings?tab=loja');

    const deleteTriggerBtn = await screen.findByRole('button', {
      name: /excluir loja/i,
    });
    await user.click(deleteTriggerBtn);

    expect(
      await screen.findByRole('heading', {
        name: /tem certeza que deseja excluir esta loja/i,
      })
    ).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', {
      name: /sim, excluir loja/i,
    });
    await user.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(ShopService.delete).toHaveBeenCalledWith({
        shopId: 'shop-1',
      });
    });

    // Automatically falls back to the second shop (Buffet Jardim, role MEMBER)
    const nameInput = await screen.findByLabelText(/nome da loja/i);
    await waitFor(() => {
      expect(nameInput).toHaveValue('Buffet Jardim');
    });
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-2');
  });

  it('allows MEMBER to leave the active shop via LeaveShopDialog and triggers zero-shop onboarding when no shops remain', async () => {
    const user = userEvent.setup();
    ShopService.getAll.mockResolvedValue([memberShop]);
    ShopService.removeMember.mockResolvedValue({
      id: 'member-self',
      shop_id: 'shop-2',
      user_id: 'user-1',
      role: 'MEMBER',
    });

    const OnboardingGuard = () => {
      const { shops, isLoading } = useShopContext();
      if (!isLoading && shops.length === 0) {
        return <CreateShopDialog open={true} isOnboarding={true} />;
      }
      return null;
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ShopContextProvider>
          <MemoryRouter initialEntries={['/settings?tab=loja']}>
            <Routes>
              <Route
                path="/settings"
                element={
                  <>
                    <SettingsPage />
                    <OnboardingGuard />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        </ShopContextProvider>
      </QueryClientProvider>
    );

    const leaveTriggerBtn = await screen.findByRole('button', {
      name: /sair da loja/i,
    });
    expect(
      screen.queryByRole('button', { name: /excluir loja/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /transferir posse/i })
    ).not.toBeInTheDocument();

    await user.click(leaveTriggerBtn);

    expect(
      await screen.findByRole('heading', {
        name: /tem certeza que deseja sair desta loja/i,
      })
    ).toBeInTheDocument();

    const confirmLeaveBtn = screen.getByRole('button', {
      name: /sim, sair da loja/i,
    });
    await user.click(confirmLeaveBtn);

    await waitFor(() => {
      expect(ShopService.removeMember).toHaveBeenCalledWith({
        shopId: 'shop-2',
        userId: 'user-1',
      });
    });

    // Zero shops remain -> onboarding dialog opens
    expect(
      await screen.findByRole('heading', { name: /crie sua primeira loja/i })
    ).toBeInTheDocument();
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBeNull();
  });
});
