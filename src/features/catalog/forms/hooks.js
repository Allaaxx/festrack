import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useAdjustStock } from '@/features/catalog/api/products';
import { stockAdjustFormSchema } from '@/features/catalog/forms/schemas';

export const useStockAdjustForm = ({
  product,
  onSuccess,
  onError,
} = {}) => {
  const adjustStockMutation = useAdjustStock();

  const form = useForm({
    resolver: zodResolver(stockAdjustFormSchema),
    defaultValues: {
      type: 'ADJUSTMENT',
      quantity: 1,
      reason: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await adjustStockMutation.mutateAsync({
        productId: product?.id,
        delta: Number(values.quantity),
        type: values.type,
        reason: values.reason,
      });
      form.reset({
        type: 'ADJUSTMENT',
        quantity: 1,
        reason: '',
      });
      onSuccess?.(result);
    } catch (error) {
      onError?.(error);
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: adjustStockMutation.isPending,
  };
};
