import {
  PencilIcon,
  PlusIcon,
  ReceiptTextIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DeleteEventButton from '@/features/events/components/delete-event-button';
import EditEventSheet from '@/features/events/components/edit-event-sheet';
import { AddTransactionButton } from '@/features/transactions';
import { cn } from '@/lib/utils';

/**
 * Menu de contexto com ações rápidas ancorado a um evento do calendário.
 *
 * @param {{
 *   event: Object,
 *   children?: React.ReactNode,
 *   trigger?: React.ReactElement,
 *   disabled?: boolean,
 *   align?: 'start' | 'center' | 'end',
 *   side?: 'top' | 'bottom' | 'left' | 'right',
 *   className?: string,
 * }} props
 */
const EventDropdownMenu = ({
  event,
  children,
  trigger,
  disabled = false,
  align = 'start',
  side = 'bottom',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const pointerDownRef = useRef(null);
  const navigate = useNavigate();

  const rawEvent = event?.rawEvent ?? event ?? {};
  const eventId = rawEvent.id ?? event?.id;

  const handlePointerDown = (e) => {
    pointerDownRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (e) => {
    if (!pointerDownRef.current) return;
    const dx = Math.abs(e.clientX - pointerDownRef.current.startX);
    const dy = Math.abs(e.clientY - pointerDownRef.current.startY);
    if (dx > 5 || dy > 5) {
      pointerDownRef.current.moved = true;
    }
  };

  const handleOpenChange = (nextOpen) => {
    if (disabled) {
      setIsOpen(false);
      return;
    }

    if (!nextOpen) {
      setIsOpen(false);
      return;
    }

    if (pointerDownRef.current?.moved) {
      pointerDownRef.current = null;
      return;
    }

    setIsOpen(true);
  };

  const handleViewDetails = () => {
    setIsOpen(false);
    navigate(`/event/${eventId}`);
  };

  const handleEditEvent = () => {
    setIsOpen(false);
    setIsEditOpen(true);
  };

  const handleAddTransaction = () => {
    setIsOpen(false);
    setIsAddTxOpen(true);
  };

  const handleDeleteEvent = () => {
    setIsOpen(false);
    setIsDeleteOpen(true);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger
          disabled={disabled}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          render={trigger || children}
        />
        <DropdownMenuContent
          align={align}
          side={side}
          className={cn('min-w-52', className)}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleViewDetails}>
              <ReceiptTextIcon />
              Ver detalhes e transações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEditEvent}>
              <PencilIcon />
              Editar evento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddTransaction}>
              <PlusIcon />
              Adicionar transação
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={handleDeleteEvent}>
              <Trash2Icon />
              Excluir evento
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditOpen && (
        <EditEventSheet
          event={rawEvent}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}

      {isAddTxOpen && (
        <AddTransactionButton
          initialEventId={eventId}
          open={isAddTxOpen}
          onOpenChange={setIsAddTxOpen}
        />
      )}

      {isDeleteOpen && (
        <DeleteEventButton
          event={rawEvent}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
        />
      )}
    </>
  );
};

export default EventDropdownMenu;
