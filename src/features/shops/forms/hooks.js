import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useCreateShop } from '@/features/shops/api/hooks';
import { createShopFormSchema } from '@/features/shops/forms/schemas';

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
