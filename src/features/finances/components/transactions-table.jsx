import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns2Icon,
  PlusIcon,
  ReceiptText,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { SearchForm } from '@/components/layout';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getStoredFiltersKey,
  LOCAL_STORAGE_FINANCE_COLUMNS_KEY,
} from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import { useGetTransactions } from '@/features/finances/api/hooks';
import AddTransactionButton from '@/features/finances/components/add-transaction-button';
import DeleteTransactionButton from '@/features/finances/components/delete-transaction-button';
import EditTransactionButton from '@/features/finances/components/edit-transaction-button';
import transactionColumns from '@/features/finances/components/transaction-columns';
import TransactionTypeBadge from '@/features/finances/components/transaction-type-badge';
import { formatCurrency } from '@/helpers/currency';
import { useIsMobile } from '@/hooks/use-mobile';

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
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

/**
 * @param {{
 *   eventId?: string,
 *   testId?: string,
 *   transactions?: Array,
 *   isLoading?: boolean,
 *   isError?: boolean,
 *   refetch?: () => Promise<any>,
 *   page?: number,
 *   pageSize?: number,
 *   q?: string,
 *   onPageChange?: (page: number) => void,
 *   onPageSizeChange?: (pageSize: number) => void,
 *   onSearchChange?: (q: string) => void,
 * }} props
 */
export const TransactionsTable = ({
  eventId,
  testId,
  transactions: propTransactions,
  isLoading: propIsLoading,
  isError: propIsError,
  refetch: propRefetch,
  page,
  pageSize,
  q,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
}) => {
  const tableKey = useId();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const { user } = useAuthContext();

  const columnsStorageKey = useMemo(
    () => getStoredFiltersKey(user?.id, LOCAL_STORAGE_FINANCE_COLUMNS_KEY),
    [user?.id]
  );

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const queryParams = useMemo(
    () => (eventId ? { eventId } : { from, to }),
    [eventId, from, to]
  );

  const {
    data: fetchedTransactions,
    isLoading: queryIsLoading,
    isError: queryIsError,
    refetch: queryRefetch,
  } = useGetTransactions(queryParams);

  const transactions = useMemo(
    () => propTransactions ?? fetchedTransactions ?? [],
    [propTransactions, fetchedTransactions]
  );

  const isLoading =
    propIsLoading !== undefined
      ? propIsLoading
      : queryIsLoading && !propTransactions;

  const isError =
    propIsError !== undefined ? propIsError : queryIsError && !propTransactions;

  const refetch = propRefetch ?? queryRefetch;

  const [internalSearchTerm, setInternalSearchTerm] = useState(
    () => searchParams.get('q') ?? ''
  );
  const isSearchControlled = q !== undefined;
  const currentSearchTerm = isSearchControlled ? q : internalSearchTerm;

  const [internalPagination, setInternalPagination] = useState(() => ({
    pageIndex: Number(searchParams.get('page')) || 0,
    pageSize: Number(searchParams.get('pageSize')) || 10,
  }));

  const isPageControlled = page !== undefined;
  const isPageSizeControlled = pageSize !== undefined;

  const rawPageIndex = isPageControlled
    ? Number(page) || 0
    : internalPagination.pageIndex;
  const currentPageSize = isPageSizeControlled
    ? Number(pageSize) || 10
    : internalPagination.pageSize;

  const handleSearchChange = (value) => {
    if (onSearchChange) {
      onSearchChange(value);
    }
    if (!isSearchControlled) {
      setInternalSearchTerm(value);
    }
    if (onPageChange) {
      onPageChange(0);
    }
    if (!isPageControlled) {
      setInternalPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!currentSearchTerm?.trim()) return transactions;
    const term = currentSearchTerm.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.name?.toLowerCase().includes(term) ||
        tx.type?.toLowerCase().includes(term)
    );
  }, [transactions, currentSearchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / currentPageSize)
  );

  const effectivePageIndex = Math.min(
    Math.max(0, rawPageIndex),
    Math.max(0, totalPages - 1)
  );

  useEffect(() => {
    const maxPageIndex = Math.max(0, totalPages - 1);
    if (rawPageIndex > maxPageIndex && onPageChange) {
      onPageChange(maxPageIndex);
    }
  }, [totalPages, rawPageIndex, onPageChange]);

  const handlePaginationChange = (updater) => {
    const currentPagination = {
      pageIndex: effectivePageIndex,
      pageSize: currentPageSize,
    };
    const nextPagination =
      typeof updater === 'function' ? updater(currentPagination) : updater;

    if (nextPagination.pageIndex !== currentPagination.pageIndex) {
      if (onPageChange) {
        onPageChange(nextPagination.pageIndex);
      }
      if (!isPageControlled) {
        setInternalPagination((prev) => ({
          ...prev,
          pageIndex: nextPagination.pageIndex,
        }));
      }
    }

    if (nextPagination.pageSize !== currentPagination.pageSize) {
      if (onPageSizeChange) {
        onPageSizeChange(nextPagination.pageSize);
      }
      if (!isPageSizeControlled) {
        setInternalPagination((prev) => ({
          ...prev,
          pageSize: nextPagination.pageSize,
        }));
      }
    }
  };

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState(() => {
    try {
      const stored = localStorage.getItem(
        getStoredFiltersKey(user?.id, LOCAL_STORAGE_FINANCE_COLUMNS_KEY)
      );
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // Fallback if localStorage is inaccessible or invalid
    }
    return {};
  });
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [prevColumnsKey, setPrevColumnsKey] = useState(columnsStorageKey);
  if (prevColumnsKey !== columnsStorageKey) {
    setPrevColumnsKey(columnsStorageKey);
    let nextVisibility = {};
    try {
      const stored = localStorage.getItem(columnsStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          nextVisibility = parsed;
        }
      }
    } catch {
      // Fallback
    }
    setColumnVisibility(nextVisibility);
  }

  const handleColumnVisibilityChange = (updater) => {
    setColumnVisibility((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(columnsStorageKey, JSON.stringify(next));
      } catch (err) {
        console.error(
          'Falha ao salvar visibilidade de colunas no localStorage',
          err
        );
      }
      return next;
    });
  };

  const table = useTable({
    key: tableKey,
    features,
    data: filteredTransactions,
    columns: transactionColumns,
    getRowId: (row, index) => row.id?.toString() ?? index.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onPaginationChange: handlePaginationChange,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: effectivePageIndex,
        pageSize: currentPageSize,
      },
    },
  });

  const loadingTestId =
    testId ??
    (eventId ? 'event-transactions-skeleton' : 'transactions-loading');
  const errorTestId =
    testId ?? (eventId ? 'event-transactions-error' : 'transactions-error');
  const sectionTestId =
    testId ??
    (!transactions.length
      ? eventId
        ? 'event-transactions-empty'
        : 'transactions-empty'
      : eventId
        ? 'event-transactions-section'
        : 'transactions-table-section');

  if (isLoading) {
    return (
      <section
        data-testid={loadingTestId}
        className="flex w-full flex-col justify-start gap-4"
      >
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-8 w-full sm:w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 lg:w-44" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border p-4">
          <div className="space-y-3">
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
      <section
        data-testid={errorTestId}
        className="flex w-full flex-col justify-start gap-4"
      >
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border py-16 text-center">
          <AlertCircleIcon className="text-muted-foreground size-10" />
          <div className="space-y-1">
            <p className="font-medium">
              Não foi possível carregar as transações.
            </p>
            <p className="text-muted-foreground text-sm">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch?.()}>
            Tentar novamente
          </Button>
        </div>
      </section>
    );
  }

  const rows = table.getRowModel().rows;
  const filteredRowsCount = table.getFilteredRowModel().rows.length;
  const currentPage = (table.state.pagination?.pageIndex ?? 0) + 1;

  return (
    <section
      data-testid={sectionTestId}
      className="flex w-full flex-col justify-start gap-4"
    >
      {/* Top Bar seguindo o layout exato do Template */}
      <div className="flex flex-col-reverse items-center justify-between gap-2 sm:flex-row">
        <div className="flex w-full items-center gap-2 sm:w-fit">
          <SearchForm
            id="search-transactions"
            placeholder="Buscar por título..."
            value={currentSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-8 w-full sm:ml-auto sm:w-auto"
          />
        </div>

        <div className="flex w-full flex-col items-center gap-2 sm:w-fit sm:flex-row">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="w-full sm:w-fit">
                  <Columns2Icon />
                  <span className="hidden lg:inline">Personalizar Colunas</span>
                  <span className="lg:hidden">Colunas</span>
                  <ChevronDownIcon />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    column.id !== 'actions' &&
                    (typeof column.accessorFn !== 'undefined' ||
                      column.getCanHide())
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
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

          <AddTransactionButton
            initialEventId={eventId}
            trigger={
              eventId ? (
                <Button size="sm" className="w-full sm:w-fit">
                  <PlusIcon className="size-4" />
                  Adicionar transação
                </Button>
              ) : undefined
            }
            className="w-full sm:w-fit"
          />
        </div>
      </div>

      {/* Container da Tabela e Paginação */}
      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers
                    .filter((header) => header.column.getIsVisible())
                    .map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
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

            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {rows?.length ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-testid="transaction-row"
                    data-state={row.getIsSelected() && 'selected'}
                    className="relative z-0 cursor-pointer"
                    onClick={() => setSelectedTransaction(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        onClick={(e) => {
                          if (
                            cell.column.id === 'actions' ||
                            cell.column.id === 'select'
                          ) {
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
                    colSpan={table.getVisibleLeafColumns().length}
                    className="h-32 text-center"
                  >
                    {!transactions.length ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                        <ReceiptText className="text-muted-foreground size-8" />
                        <div className="space-y-1">
                          <p className="font-medium">
                            Nenhuma transação encontrada
                          </p>
                          {eventId && (
                            <p className="text-muted-foreground text-sm">
                              Nenhuma transação registrada para este evento.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      'Nenhuma transação corresponde ao filtro.'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Rodapé de Paginação  */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            Exibindo {rows.length} de {filteredRowsCount} transação(ões).
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Linhas por página
              </Label>
              <Select
                value={`${table.state.pagination.pageSize}`}
                disabled={!filteredRowsCount}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.state.pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {currentPage} de {totalPages}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="Primeira página"
              >
                <span className="sr-only">Primeira página</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Página anterior"
              >
                <span className="sr-only">Página anterior</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Próxima página"
              >
                <span className="sr-only">Próxima página</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(totalPages - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Última página"
              >
                <span className="sr-only">Última página</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer lateral/inferior seguindo o padrão visual do TableCellViewer do Template */}
      <Drawer
        direction={isMobile ? 'bottom' : 'right'}
        open={Boolean(selectedTransaction)}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      >
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>Detalhes da Transação</DrawerTitle>
            <DrawerDescription>
              {selectedTransaction?.name
                ? `Informações completas de ${selectedTransaction.name}.`
                : 'Informações completas do registro financeiro selecionado.'}
            </DrawerDescription>
          </DrawerHeader>

          {selectedTransaction && (
            <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
              <Separator />
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Título</span>
                  <span className="font-medium">
                    {selectedTransaction.name}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <TransactionTypeBadge
                    variant={selectedTransaction.type.toLowerCase()}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span>
                    {format(
                      parseDateSafely(selectedTransaction.date),
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </span>
                </div>
              </div>
              <Separator />
            </div>
          )}

          <DrawerFooter>
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
