import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
      return (
        <div className="flex items-center gap-2">
          <EditTransactionButton transaction={transaction} />
          <DeleteTransactionButton transaction={transaction} />
        </div>
      );
    },
  },
];

export default transactionColumns;
