import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LOCAL_STORAGE_ACTIVE_SHOP_KEY } from '@/constants/local-storage';
import ShopService from '@/features/shops/api/services';
import protectedApi from '@/lib/axios';

vi.mock('@/lib/axios', () => {
  const mockProtectedApi = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mockProtectedApi,
    protectedApi: mockProtectedApi,
  };
});

describe('ShopService & constants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defines LOCAL_STORAGE_ACTIVE_SHOP_KEY as festrack:active-shop-id', () => {
    expect(LOCAL_STORAGE_ACTIVE_SHOP_KEY).toBe('festrack:active-shop-id');
  });

  describe('getAll', () => {
    it('fetches all shops for the authenticated user via GET /shops', async () => {
      const mockShops = [
        {
          id: 'shop-1',
          name: 'Loja Matriz',
          description: 'Unidade principal',
          role: 'OWNER',
        },
        {
          id: 'shop-2',
          name: 'Filial Sul',
          description: null,
          role: 'MEMBER',
        },
      ];
      protectedApi.get.mockResolvedValue({ data: mockShops });

      const result = await ShopService.getAll();

      expect(protectedApi.get).toHaveBeenCalledWith('/shops');
      expect(result).toEqual(mockShops);
    });
  });

  describe('create', () => {
    it('creates a new shop via POST /shops normalizing optional description', async () => {
      const createdShop = {
        id: 'shop-new',
        name: 'Nova Loja',
        description: null,
        role: 'OWNER',
      };
      protectedApi.post.mockResolvedValue({ data: createdShop });

      const result = await ShopService.create({
        name: 'Nova Loja',
        description: '',
      });

      expect(protectedApi.post).toHaveBeenCalledWith('/shops', {
        name: 'Nova Loja',
        description: null,
      });
      expect(result).toEqual(createdShop);
    });
  });

  describe('getById', () => {
    it('fetches a shop by string or object shopId via GET /shops/:shopId', async () => {
      const mockShop = {
        id: 'shop-1',
        name: 'Loja Matriz',
        description: 'Unidade principal',
      };
      protectedApi.get.mockResolvedValue({ data: mockShop });

      const resultByString = await ShopService.getById('shop-1');
      expect(protectedApi.get).toHaveBeenCalledWith('/shops/shop-1');
      expect(resultByString).toEqual(mockShop);

      const resultByObject = await ShopService.getById({ shopId: 'shop-1' });
      expect(protectedApi.get).toHaveBeenLastCalledWith('/shops/shop-1');
      expect(resultByObject).toEqual(mockShop);
    });
  });

  describe('update', () => {
    it('updates a shop via PATCH /shops/:shopId', async () => {
      const updatedShop = {
        id: 'shop-1',
        name: 'Loja Atualizada',
        description: 'Nova descrição',
      };
      protectedApi.patch.mockResolvedValue({ data: updatedShop });

      const result = await ShopService.update({
        shopId: 'shop-1',
        name: 'Loja Atualizada',
        description: 'Nova descrição',
      });

      expect(protectedApi.patch).toHaveBeenCalledWith('/shops/shop-1', {
        name: 'Loja Atualizada',
        description: 'Nova descrição',
      });
      expect(result).toEqual(updatedShop);
    });
  });

  describe('delete', () => {
    it('deletes a shop via DELETE /shops/:shopId', async () => {
      const deletedShop = { id: 'shop-1', name: 'Loja Matriz' };
      protectedApi.delete.mockResolvedValue({ data: deletedShop });

      const result = await ShopService.delete({ shopId: 'shop-1' });

      expect(protectedApi.delete).toHaveBeenCalledWith('/shops/shop-1');
      expect(result).toEqual(deletedShop);
    });
  });

  describe('getMembers', () => {
    it('fetches active members of a shop via GET /shops/:shopId/members', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          shop_id: 'shop-1',
          user_id: 'user-1',
          role: 'OWNER',
          created_at: '2026-01-10T10:00:00.000Z',
          user: {
            id: 'user-1',
            name: 'Maria Silva',
            email: 'maria@example.com',
            image: null,
          },
        },
      ];
      protectedApi.get.mockResolvedValue({ data: mockMembers });

      const result = await ShopService.getMembers({ shopId: 'shop-1' });

      expect(protectedApi.get).toHaveBeenCalledWith('/shops/shop-1/members');
      expect(result).toEqual(mockMembers);
    });
  });

  describe('removeMember', () => {
    it('removes a member from a shop via DELETE /shops/:shopId/members/:userId', async () => {
      const removedMember = {
        id: 'member-2',
        shop_id: 'shop-1',
        user_id: 'user-2',
        role: 'MEMBER',
      };
      protectedApi.delete.mockResolvedValue({ data: removedMember });

      const result = await ShopService.removeMember({
        shopId: 'shop-1',
        userId: 'user-2',
      });

      expect(protectedApi.delete).toHaveBeenCalledWith(
        '/shops/shop-1/members/user-2'
      );
      expect(result).toEqual(removedMember);
    });
  });

  describe('transferOwnership', () => {
    it('transfers ownership via POST /shops/:shopId/transfer-ownership with new_owner_user_id', async () => {
      const updatedMember = {
        id: 'member-2',
        shop_id: 'shop-1',
        user_id: 'user-2',
        role: 'OWNER',
      };
      protectedApi.post.mockResolvedValue({ data: updatedMember });

      const result = await ShopService.transferOwnership({
        shopId: 'shop-1',
        newOwnerUserId: 'user-2',
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-1/transfer-ownership',
        { new_owner_user_id: 'user-2' }
      );
      expect(result).toEqual(updatedMember);
    });
  });

  describe('getInvitations', () => {
    it('fetches pending invitations via GET /shops/:shopId/invitations', async () => {
      const mockInvitations = [
        {
          id: 'inv-1',
          shop_id: 'shop-1',
          email: 'carlos@example.com',
          role: 'MEMBER',
          token: 'token-abc-123',
          status: 'PENDING',
          expires_at: '2026-01-17T10:00:00.000Z',
        },
      ];
      protectedApi.get.mockResolvedValue({ data: mockInvitations });

      const result = await ShopService.getInvitations({ shopId: 'shop-1' });

      expect(protectedApi.get).toHaveBeenCalledWith(
        '/shops/shop-1/invitations'
      );
      expect(result).toEqual(mockInvitations);
    });
  });

  describe('createInvitation', () => {
    it('creates an invitation via POST /shops/:shopId/invitations defaulting role to MEMBER', async () => {
      const createdInvitation = {
        id: 'inv-1',
        shop_id: 'shop-1',
        email: 'carlos@example.com',
        role: 'MEMBER',
        token: 'token-abc-123',
        status: 'PENDING',
        expires_at: '2026-01-17T10:00:00.000Z',
      };
      protectedApi.post.mockResolvedValue({ data: createdInvitation });

      const result = await ShopService.createInvitation({
        shopId: 'shop-1',
        email: 'carlos@example.com',
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-1/invitations',
        {
          email: 'carlos@example.com',
          role: 'MEMBER',
        }
      );
      expect(result).toEqual(createdInvitation);
    });
  });

  describe('revokeInvitation', () => {
    it('revokes an invitation via DELETE /shops/:shopId/invitations/:invitationId', async () => {
      const revokedInvitation = {
        id: 'inv-1',
        shop_id: 'shop-1',
        status: 'REVOKED',
      };
      protectedApi.delete.mockResolvedValue({ data: revokedInvitation });

      const result = await ShopService.revokeInvitation({
        shopId: 'shop-1',
        invitationId: 'inv-1',
      });

      expect(protectedApi.delete).toHaveBeenCalledWith(
        '/shops/shop-1/invitations/inv-1'
      );
      expect(result).toEqual(revokedInvitation);
    });
  });
});
