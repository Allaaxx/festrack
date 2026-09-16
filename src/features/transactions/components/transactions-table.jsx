import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { AlertCircleIcon, ArrowUpDown, ReceiptText } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetTransactions } from '@/features/transactions/api/hooks';
import AddTransactionButton from '@/features/transactions/components/add-transaction-button';
import DeleteTransactionButton from '@/features/transactions/components/delete-transaction-button';
import EditTransactionButton from '@/features/transactions/components/edit-transaction-button';
import TransactionTypeBadge from '@/features/transactions/components/transaction-type-badge';
import { formatCurrency } from '@/helpers/currency';

const columns = [
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
      return format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      });
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

const TransactionsTable = () => {
  const [searchParams] = useSearchParams();

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const {
    data: transactions,
    isLoading,
    isError,
    refetch,
  } = useGetTransactions({ from, to });

  if (isLoading) {
    return (
      <section>
        <h2 className="mb-4 text-2xl font-bold">Transações</h2>
        <div className="rounded-md border">
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section>
        <h2 className="mb-4 text-2xl font-bold">Transações</h2>
        <div className="flex flex-col items-center justify-center gap-4 rounded-md border py-16 text-center">
          <AlertCircleIcon className="text-muted-foreground size-10" />
          <div className="space-y-1">
            <p className="font-medium">
              Não foi possível carregar as transações.
            </p>
            <p className="text-muted-foreground text-sm">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </section>
    );
  }

  if (!transactions?.length) {
    return (
      <section>
        <h2 className="mb-4 text-2xl font-bold">Transações</h2>
        <div className="flex flex-col items-center justify-center gap-4 rounded-md border py-16 text-center">
          <ReceiptText className="text-muted-foreground size-10" />
          <div className="space-y-1">
            <p className="font-medium">Nenhuma transação encontrada</p>
            <p className="text-muted-foreground text-sm">
              Nenhuma transação registrada no período selecionado.
            </p>
          </div>
          <AddTransactionButton />
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Transações</h2>

      <ScrollArea className="h-90 rounded-md border">
        <DataTable columns={columns} data={transactions} />
      </ScrollArea>
    </section>
  );
};

export default TransactionsTable;
