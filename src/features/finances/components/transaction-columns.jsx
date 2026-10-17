import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowUpDown,
  EllipsisVertical,
  PenBoxIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DeleteTransactionButton from '@/features/finances/components/delete-transaction-button';
import EditTransactionButton from '@/features/finances/components/edit-transaction-button';
import TransactionTypeBadge from '@/features/finances/components/transaction-type-badge';
import { formatCurrency } from '@/helpers/currency';

const parseDateSafely = (dateValue) => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  const str = String(dateValue).trim();
  const matchDate = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchDate && !str.includes('T')) {
    const [, year, month, day] = matchDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(dateValue);
};

/**
 * Célula isolada de ações para uma linha de transação.
 * Renderiza o dropdown de ações e monta os modais de edição e exclusão
 * fora do container do menu, isolando a propagação de eventos para que
 * cliques não acionem o drawer de detalhes da linha.
 *
 * @param {{ transaction: Object }} props
 */
export const TransactionActionsCell = ({ transaction }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleEditClick = (e) => {
    e?.stopPropagation?.();
    setIsDropdownOpen(false);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (e) => {
    e?.stopPropagation?.();
    setIsDropdownOpen(false);
    setIsDeleteOpen(true);
  };

  return (
    <div
      className="x flex items-center"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
              size="icon"
              aria-label="Ações da transação"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <EllipsisVertical />
              <span className="sr-only">Ações da transação</span>
            </Button>
          }
        />
        <DropdownMenuContent
          align="end"
          className="w-32"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onClick={handleEditClick}
            aria-label="Editar transação"
          >
            <PenBoxIcon />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleDeleteClick}
            aria-label="Excluir transação"
          >
            <Trash2Icon />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <EditTransactionButton
            transaction={transaction}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            trigger={null}
          />
        </div>
      )}

      {isDeleteOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DeleteTransactionButton
            transaction={transaction}
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            trigger={null}
          />
        </div>
      )}
    </div>
  );
};

export const transactionColumns = [
  {
    accessorKey: 'name',

    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },

    sortFn: (rowA, rowB, columnId) => {
      const nameA = String(rowA.getValue(columnId) ?? '');
      const nameB = String(rowB.getValue(columnId) ?? '');

      return nameA.localeCompare(nameB, 'pt-BR', {
        sensitivity: 'base',
        numeric: true,
      });
    },
  },

  {
    accessorKey: 'type',

    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Tipo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },

    sortFn: (rowA, rowB, columnId) => {
      const typeA = String(rowA.getValue(columnId) ?? '');
      const typeB = String(rowB.getValue(columnId) ?? '');

      return typeA.localeCompare(typeB, 'pt-BR', {
        sensitivity: 'base',
      });
    },

    cell: ({ row: { original: transaction } }) => {
      return <TransactionTypeBadge variant={transaction.type.toLowerCase()} />;
    },
  },

  {
    accessorKey: 'date',

    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },

    sortFn: (rowA, rowB, columnId) => {
      const dateA = new Date(String(rowA.getValue(columnId) ?? '')).getTime();
      const dateB = new Date(String(rowB.getValue(columnId) ?? '')).getTime();

      return dateA - dateB;
    },

    cell: ({ row: { original: transaction } }) => {
      return format(
        parseDateSafely(transaction.date),
        "dd 'de' MMMM 'de' yyyy",
        {
          locale: ptBR,
        }
      );
    },
  },

  {
    accessorKey: 'amount',

    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },

    sortFn: (rowA, rowB, columnId) => {
      const amountA = Number(rowA.getValue(columnId) ?? 0);
      const amountB = Number(rowB.getValue(columnId) ?? 0);

      return amountA - amountB;
    },

    cell: ({ row: { original: transaction } }) => {
      return formatCurrency(transaction.amount);
    },
  },

  {
    id: 'actions',
    header: 'Ações',
    enableSorting: false,

    cell: ({ row: { original: transaction } }) => {
      return <TransactionActionsCell transaction={transaction} />;
    },
  },
];

export default transactionColumns;
