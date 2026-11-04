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

  describe('getInvitationByToken', () => {
    it('fetches invitation details by string or object token via GET /shops/invitations/:token', async () => {
      const mockInvitation = {
        id: 'inv-1',
        shop_id: 'shop-1',
        shop: { id: 'shop-1', name: 'Loja Matriz' },
        email: 'convidado@example.com',
        role: 'MEMBER',
        status: 'PENDING',
        expires_at: '2099-12-31T23:59:59.000Z',
      };
      protectedApi.get.mockResolvedValue({ data: mockInvitation });

      const resultByString = await ShopService.getInvitationByToken('tok-123');
      expect(protectedApi.get).toHaveBeenCalledWith(
        '/shops/invitations/tok-123'
      );
      expect(resultByString).toEqual(mockInvitation);

      const resultByObject = await ShopService.getInvitationByToken({
        token: 'tok-123',
      });
      expect(protectedApi.get).toHaveBeenLastCalledWith(
        '/shops/invitations/tok-123'
      );
      expect(resultByObject).toEqual(mockInvitation);
    });
  });

  describe('acceptInvitation', () => {
    it('accepts an invitation by string or object token via POST /shops/invitations/:token/accept', async () => {
      const mockMember = {
        id: 'member-1',
        shop_id: 'shop-1',
        user_id: 'user-2',
        role: 'MEMBER',
      };
      protectedApi.post.mockResolvedValue({ data: mockMember });

      const resultByString = await ShopService.acceptInvitation('tok-123');
      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/invitations/tok-123/accept'
      );
      expect(resultByString).toEqual(mockMember);

      const resultByObject = await ShopService.acceptInvitation({
        token: 'tok-123',
      });
      expect(protectedApi.post).toHaveBeenLastCalledWith(
        '/shops/invitations/tok-123/accept'
      );
      expect(resultByObject).toEqual(mockMember);
    });
  });
});
