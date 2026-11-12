'use client';

import { AlertTriangleIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRentalCheckIn } from '@/features/catalog/api/rentals';

function RentalCheckinForm({ rental, onOpenChange }) {
  const [items, setItems] = useState(() =>
    rental?.items?.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      returnedQuantity: item.quantity,
      lossQuantity: 0,
      lossNote: '',
    })) || []
  );
  const [errors, setErrors] = useState({});
  const { mutateAsync: checkIn, isPending } = useRentalCheckIn();

  const handleIntactChange = (itemId, val) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, returnedQuantity: num } : it))
    );
    if (errors[itemId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  };

  const handleLossChange = (itemId, val) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, lossQuantity: num } : it))
    );
    if (errors[itemId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  };

  const handleNoteChange = (itemId, val) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, lossNote: val } : it))
    );
    if (errors[itemId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    items.forEach((item) => {
      const intact = Number(item.returnedQuantity) || 0;
      const loss = Number(item.lossQuantity) || 0;

      if (intact + loss !== item.quantity) {
        newErrors[item.id] =
          `A soma de itens intactos e avarias deve ser igual a ${item.quantity}.`;
      } else if (loss > 0 && !item.lossNote?.trim()) {
        newErrors[item.id] =
          'O motivo da avaria é obrigatório quando há perdas ou danos.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rental || !validate()) {
      return;
    }

    try {
      await checkIn({
        rentalId: rental.id,
        items: items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          returnedQuantity: Number(it.returnedQuantity) || 0,
          lossQuantity: Number(it.lossQuantity) || 0,
          lossNote: it.lossNote?.trim() || '',
        })),
      });
      onOpenChange?.(false);
    } catch {
      // Handled by mutation hook's onError toast
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Check-in de Locação</DialogTitle>
        <DialogDescription>
          Inspeção e conferência de devolução de itens para o evento.
        </DialogDescription>
      </DialogHeader>

      <div className="bg-muted/40 rounded-lg border p-3 text-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              {rental.customerName}
            </span>
            <Badge variant="outline" className="text-xs">
              {rental.scheduledDates}
            </Badge>
          </div>
          <span className="text-muted-foreground text-xs">
            {rental.eventName}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">Itens Alocados</span>
          {items.map((item) => {
            const itemError = errors[item.id];
            const hasLoss = Number(item.lossQuantity) > 0;

            return (
              <div
                key={item.id}
                className="rounded-lg border bg-card p-3 shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {item.productName}
                  </span>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {item.quantity} un alocada{item.quantity > 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`intact-${item.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Retornados Intactos
                    </Label>
                    <Input
                      id={`intact-${item.id}`}
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={item.returnedQuantity}
                      onChange={(e) =>
                        handleIntactChange(item.id, e.target.value)
                      }
                      disabled={isPending}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`loss-${item.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Avarias / Perdas
                    </Label>
                    <Input
                      id={`loss-${item.id}`}
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={item.lossQuantity}
                      onChange={(e) =>
                        handleLossChange(item.id, e.target.value)
                      }
                      disabled={isPending}
                    />
                  </div>
                </div>

                {hasLoss && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <Label
                      htmlFor={`note-${item.id}`}
                      className="text-xs font-medium text-destructive flex items-center gap-1"
                    >
                      <AlertTriangleIcon className="size-3.5" />
                      Motivo da Avaria / Perda *
                    </Label>
                    <Textarea
                      id={`note-${item.id}`}
                      placeholder="Descreva a avaria ou motivo da perda..."
                      value={item.lossNote}
                      onChange={(e) =>
                        handleNoteChange(item.id, e.target.value)
                      }
                      disabled={isPending}
                      className="min-h-16 text-xs"
                    />
                  </div>
                )}

                {itemError && (
                  <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                    <AlertTriangleIcon className="size-3.5 shrink-0" />
                    {itemError}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="size-4 animate-spin mr-1" />}
            Concluir Check-in
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/**
 * Rental Check-in Dialog.
 * Allows post-event inspection and component-level verification,
 * reporting returned intact units and damage/loss write-offs.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onOpenChange
 * @param {object} props.rental
 */
export default function RentalCheckinDialog({
  open,
  onOpenChange,
  rental,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {open && rental && (
          <RentalCheckinForm
            key={`${rental.id}-${open}`}
            rental={rental}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
