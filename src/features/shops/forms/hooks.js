import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  useCreateShop,
  useCreateShopInvitation,
  useEditShop,
} from '@/features/shops/api/hooks';
import {
  createShopFormSchema,
  editShopFormSchema,
  inviteMemberFormSchema,
} from '@/features/shops/forms/schemas';

export const useCreateShopForm = ({ onSuccess, onError } = {}) => {
  const { mutateAsync: createShop } = useCreateShop();
  const form = useForm({
    resolver: zodResolver(createShopFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const createdShop = await createShop({
        name: data.name,
        description: data.description || null,
      });
      onSuccess?.(createdShop);
    } catch (error) {
      console.error(error);
      onError?.(error);
    }
  };

  return { form, onSubmit };
};

export const useEditShopForm = ({ shop, onSuccess, onError } = {}) => {
  const { mutateAsync: editShop } = useEditShop();
  const form = useForm({
    resolver: zodResolver(editShopFormSchema),
    defaultValues: {
      name: shop?.name ?? '',
      description: shop?.description ?? '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const updatedShop = await editShop({
        shopId: shop?.id,
        name: data.name,
        description: data.description || null,
      });
      onSuccess?.(updatedShop);
    } catch (error) {
      console.error(error);
      onError?.(error);
    }
  };

  return { form, onSubmit };
};

export const useInviteMemberForm = ({ shopId, onSuccess, onError } = {}) => {
  const { mutateAsync: createInvitation } = useCreateShopInvitation();
  const form = useForm({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER',
    },
  });

  const onSubmit = async (data) => {
    try {
      const invitation = await createInvitation({
        shopId,
        email: data.email,
        role: data.role || 'MEMBER',
      });
      onSuccess?.(invitation);
    } catch (error) {
      console.error(error);
      onError?.(error);
    }
  };

  return { form, onSubmit };
};
