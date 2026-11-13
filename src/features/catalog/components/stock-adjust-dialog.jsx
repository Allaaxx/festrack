import { Loader2Icon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useStockAdjustForm } from '@/features/catalog/forms/hooks';

/**
 * Dialog for recording audited manual stock adjustments for simple physical products.
 *
 * @param {Object} props
 * @param {boolean} props.open - Controlled open state.
 * @param {Function} props.onOpenChange - Callback when open state changes.
 * @param {Object} [props.product] - Product entity to adjust stock for.
 * @param {Function} [props.onSuccess] - Optional callback executed on adjustment success.
 */
const StockAdjustDialog = ({
  open,
  onOpenChange,
  product,
  onSuccess,
}) => {
  const { form, onSubmit, isSubmitting } = useStockAdjustForm({
    product,
    onSuccess: (result) => {
      onOpenChange?.(false);
      onSuccess?.(result);
    },
  });

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      form.reset({
        type: 'ADJUSTMENT',
        quantity: 1,
        reason: '',
      });
    }
    prevOpenRef.current = open;
  }, [open, form]);

  const onHand = product?.stock?.quantity ?? product?.quantity ?? 0;
  const reserved = product?.stock?.reserved ?? product?.reserved ?? 0;
  const available = Math.max(0, onHand - reserved);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>
            Registre movimentações manuais de entrada, perda ou balanço físico
            com justificativa auditável.
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Produto:</span>
              <span className="font-semibold text-foreground">
                {product.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                Estoque Físico Atual:
              </span>
              <span className="font-medium text-foreground">{onHand} un</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estoque Reservado:</span>
              <span className="font-medium text-foreground">{reserved} un</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="text-muted-foreground">Disponível:</span>
              <span className="font-semibold text-primary">{available} un</span>
            </div>
          </div>
        )}

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            {/* Tipo de Movimentação */}
            <Field>
              <FieldLabel htmlFor="stock-movement-type">
                Tipo de Movimentação
              </FieldLabel>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="stock-movement-type" className="w-full">
                      <SelectValue placeholder="Selecione o tipo de movimentação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADJUSTMENT">
                        Ajuste de Balanço / Inventário
                      </SelectItem>
                      <SelectItem value="INBOUND">
                        Nova Entrada / Compra
                      </SelectItem>
                      <SelectItem value="LOSS">Descarte / Perda</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.type && (
                <FieldError>{form.formState.errors.type.message}</FieldError>
              )}
            </Field>

            {/* Quantidade / Delta */}
            <Field>
              <FieldLabel htmlFor="stock-movement-quantity">
                Quantidade
              </FieldLabel>
              <Input
                id="stock-movement-quantity"
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 5"
                disabled={isSubmitting}
                {...form.register('quantity', { valueAsNumber: false })}
              />
              {form.formState.errors.quantity && (
                <FieldError>
                  {form.formState.errors.quantity.message}
                </FieldError>
              )}
            </Field>

            {/* Motivo / Justificativa */}
            <Field>
              <FieldLabel htmlFor="stock-movement-reason">
                Motivo / Justificativa
              </FieldLabel>
              <Textarea
                id="stock-movement-reason"
                rows={3}
                placeholder="Descreva o motivo desta alteração para auditoria..."
                disabled={isSubmitting}
                {...form.register('reason')}
              />
              {form.formState.errors.reason && (
                <FieldError>{form.formState.errors.reason.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2Icon className="size-4 animate-spin mr-2" />
              )}
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustDialog;
