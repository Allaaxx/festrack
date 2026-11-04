import { Loader2Icon } from 'lucide-react';
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useShopContext } from '@/contexts/shop';
import { useEditShopForm } from '@/features/shops/forms/hooks';

const ShopGeneralForm = () => {
  const { activeShop, role } = useShopContext();
  const isOwner = (activeShop?.role ?? role) === 'OWNER';

  const { form, onSubmit } = useEditShopForm({
    shop: activeShop,
    onSuccess: () => {
      toast.add({
        type: 'success',
        title: 'Dados da loja atualizados com sucesso!',
        description: 'As informações gerais da loja foram salvas.',
      });
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Erro ao atualizar dados da loja',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Tente novamente mais tarde.',
      });
    },
  });

  useEffect(() => {
    form.reset({
      name: activeShop?.name ?? '',
      description: activeShop?.description ?? '',
    });
  }, [activeShop?.id, activeShop?.name, activeShop?.description, form]);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">Dados da Loja</h3>
        <p className="text-muted-foreground text-sm">
          Visualize e gerencie o nome e a descrição da loja ativa.
        </p>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mx-auto space-y-6"
            >
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="shop-settings-name">
                        Nome da loja
                      </FieldLabel>
                      <Input
                        {...field}
                        id="shop-settings-name"
                        aria-invalid={fieldState.invalid}
                        placeholder="Ex: Atelier Central"
                        autoComplete="off"
                        disabled={!isOwner || form.formState.isSubmitting}
                        readOnly={!isOwner}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="shop-settings-description">
                        Descrição
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="shop-settings-description"
                        aria-invalid={fieldState.invalid}
                        placeholder="Descreva o propósito ou unidade da loja..."
                        autoComplete="off"
                        value={field.value ?? ''}
                        rows={3}
                        disabled={!isOwner || form.formState.isSubmitting}
                        readOnly={!isOwner}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              {isOwner ? (
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="max-sm:w-full"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar alterações'
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Você possui acesso de leitura como membro. Apenas
                  proprietários podem editar os dados da loja.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopGeneralForm;
