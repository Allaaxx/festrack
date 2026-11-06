import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Reusable accessible confirmation dialog for destructive actions.
 * Adheres strictly to Base UI render prop conventions (never uses asChild).
 *
 * @param {Object} props
 * @param {boolean} [props.open] - Controlled open boolean
 * @param {boolean} [props.defaultOpen=false] - Initial uncontrolled open state
 * @param {function} [props.onOpenChange] - Callback invoked when open state changes
 * @param {React.ReactElement|null} [props.trigger] - Trigger element (or null to omit)
 * @param {React.ReactNode} [props.title='Excluir?'] - Dialog title
 * @param {React.ReactNode} [props.description='Esta ação não poderá ser desfeita.'] - Dialog description
 * @param {string} [props.confirmLabel='Excluir'] - Confirmation button label
 * @param {string} [props.cancelLabel='Cancelar'] - Cancellation button label
 * @param {function} [props.onConfirm] - Confirm handler (async or sync)
 * @param {function} [props.onCancel] - Cancel handler
 * @param {boolean} [props.isPending=false] - Whether confirmation operation is in flight
 * @param {React.ReactNode} [props.children] - Supplementary content slot
 * @param {string} [props.contentClassName] - Additional classes for DialogContent
 */
function ConfirmDeleteDialog({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title = 'Excluir?',
  description = 'Esta ação não poderá ser desfeita.',
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  isPending = false,
  children,
  contentClassName,
}) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const dialogOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (nextOpen) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleConfirm = async (event) => {
    await onConfirm?.(event);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className={cn('sm:max-w-md', contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}

        <DialogFooter className="gap-2 sm:justify-end">
          <DialogClose
            render={
              <Button variant="outline" disabled={isPending} onClick={onCancel}>
                {cancelLabel}
              </Button>
            }
          />
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDeleteDialog };
export default ConfirmDeleteDialog;
