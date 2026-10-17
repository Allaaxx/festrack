import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns2Icon,
  ReceiptText,
} from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetTransactions } from '@/features/finances/api/hooks';
import AddTransactionButton from '@/features/finances/components/add-transaction-button';
import DeleteTransactionButton from '@/features/finances/components/delete-transaction-button';
import EditTransactionButton from '@/features/finances/components/edit-transaction-button';
import transactionColumns from '@/features/finances/components/transaction-columns';
import TransactionTypeBadge from '@/features/finances/components/transaction-type-badge';
import { formatCurrency } from '@/helpers/currency';

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  columnVisibilityFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const columnLabels = {
  name: 'Título',
  type: 'Tipo',
  date: 'Data',
  amount: 'Valor',
};

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

export const TransactionsTable = ({ transactions: propTransactions }) => {
  const tableKey = useId();
  const [searchParams] = useSearchParams();

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const {
    data: fetchedTransactions,
    isLoading,
    isError,
    refetch,
  } = useGetTransactions({ from, to });

  const transactions = useMemo(
    () => propTransactions ?? fetchedTransactions ?? [],
    [propTransactions, fetchedTransactions]
  );
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.name?.toLowerCase().includes(term) ||
        tx.type?.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const table = useTable({
    key: tableKey,
    features,
    data: filteredTransactions,
    columns: transactionColumns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
  });

  if (isLoading && !propTransactions) {
    return (
      <section data-testid="transactions-loading" className="space-y-4">
        <h2 className="text-2xl font-bold">Transações</h2>
        <div className="rounded-md border p-4">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError && !propTransactions) {
    return (
      <section data-testid="transactions-error" className="space-y-4">
        <h2 className="text-2xl font-bold">Transações</h2>
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

  if (!transactions.length) {
    return (
      <section data-testid="transactions-empty" className="space-y-4">
        <h2 className="text-2xl font-bold">Transações</h2>
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

  const rows = table.getRowModel().rows;
  const filteredRowsCount = table.getFilteredRowModel().rows.length;
  const totalPages = table.getPageCount() || 1;
  const currentPage = (table.state.pagination?.pageIndex ?? 0) + 1;

  return (
    <section data-testid="transactions-table-section" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Transações</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Columns2Icon className="size-4" />
                  <span className="hidden sm:inline">Colunas</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.id !== 'actions')
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(Boolean(value))
                    }
                  >
                    {columnLabels[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <AddTransactionButton />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-testid="transaction-row"
                  className="cursor-pointer transition-colors"
                  onClick={() => setSelectedTransaction(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (cell.column.id === 'actions') {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={transactionColumns.length}
                  className="h-24 text-center"
                >
                  Nenhuma transação corresponde ao filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
          <div className="text-muted-foreground text-sm">
            Exibindo {rows.length} de {filteredRowsCount} transações
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="Primeira página"
            >
              <ChevronsLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>

            <span className="px-2 text-sm font-medium">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Próxima página"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(totalPages - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Última página"
            >
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Drawer
        open={Boolean(selectedTransaction)}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      >
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Detalhes da Transação</DrawerTitle>
            <DrawerDescription>
              Informações completas do registro financeiro selecionado.
            </DrawerDescription>
          </DrawerHeader>

          {selectedTransaction && (
            <div className="space-y-3 px-4 py-2">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground text-sm">Título</span>
                <span className="font-semibold">
                  {selectedTransaction.name}
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground text-sm">Tipo</span>
                <TransactionTypeBadge
                  variant={selectedTransaction.type.toLowerCase()}
                />
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground text-sm">Valor</span>
                <span className="text-lg font-bold">
                  {formatCurrency(selectedTransaction.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground text-sm">Data</span>
                <span className="text-sm">
                  {format(
                    parseDateSafely(selectedTransaction.date),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR }
                  )}
                </span>
              </div>
            </div>
          )}

          <DrawerFooter className="flex flex-row justify-end gap-2 pt-4">
            {selectedTransaction && (
              <>
                <EditTransactionButton
                  transaction={selectedTransaction}
                  onSuccess={() => setSelectedTransaction(null)}
                />
                <DeleteTransactionButton
                  transaction={selectedTransaction}
                  onSuccess={() => setSelectedTransaction(null)}
                />
              </>
            )}
            <DrawerClose render={<Button variant="outline">Fechar</Button>} />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </section>
  );
};

export default TransactionsTable;
