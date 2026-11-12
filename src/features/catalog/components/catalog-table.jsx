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
import {
  ArrowUpDown,
  BoxesIcon,
  HistoryIcon,
  LayersIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PackageIcon,
  PackageSearchIcon,
  PencilIcon,
  PowerOffIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetProducts } from '@/features/catalog/api/products';
import BundleBottleneckPopover from '@/features/catalog/components/bundle-bottleneck-popover';
import StockAdjustDialog from '@/features/catalog/components/stock-adjust-dialog';
import { getAvailableStock } from '@/features/catalog/helpers/bundle';
import { formatCurrency } from '@/helpers/currency';
import { cn } from '@/lib/utils';

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

/**
 * Renders contextual action menu items tailored to the product classification:
 * - Simple sale/rent: Editar, Ajustar Estoque, Histórico
 * - Service: Editar, Desativar
 * - Virtual Bundle: Editar Composição, Inspecionar Componentes
 */
const CatalogRowActions = ({ product, onAction }) => {
  const isBundle = Boolean(product.is_bundle);
  const isService = product.type === 'service';

  return (
    <div
      className="flex items-center justify-end"
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={`Ações para ${product.name}`}
            >
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">Ações para {product.name}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          {isBundle ? (
            <>
              <DropdownMenuItem
                onClick={() => onAction?.('edit-composition', product)}
              >
                <LayersIcon className="size-4 mr-2 text-primary" />
                Editar Composição
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction?.('inspect-components', product)}
              >
                <BoxesIcon className="size-4 mr-2 text-muted-foreground" />
                Inspecionar Componentes
              </DropdownMenuItem>
            </>
          ) : isService ? (
            <>
              <DropdownMenuItem onClick={() => onAction?.('edit', product)}>
                <PencilIcon className="size-4 mr-2 text-muted-foreground" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onAction?.('deactivate', product)}
              >
                <PowerOffIcon className="size-4 mr-2" />
                Desativar
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => onAction?.('edit', product)}>
                <PencilIcon className="size-4 mr-2 text-muted-foreground" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction?.('adjust-stock', product)}
              >
                <SlidersHorizontalIcon className="size-4 mr-2 text-muted-foreground" />
                Ajustar Estoque
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('history', product)}>
                <HistoryIcon className="size-4 mr-2 text-muted-foreground" />
                Histórico
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

/**
 * Catalog Table component displaying products, classification badges,
 * dynamic bottleneck stock calculations for virtual bundles, search, and category filters.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.products] - Products directory list.
 * @param {boolean} [props.isLoading] - Loading state indicator.
 * @param {boolean} [props.isError] - Error state indicator.
 * @param {Function} [props.onAction] - Contextual action dispatcher callback.
 * @param {string} [props.className] - Container CSS class names.
 */
const CatalogTable = ({
  products: propProducts,
  isLoading: propIsLoading,
  isError: propIsError,
  onAction,
  className,
}) => {
  const tableKey = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [adjustDialogProduct, setAdjustDialogProduct] = useState(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);

  const handleRowAction = useCallback(
    (action, product) => {
      if (action === 'adjust-stock') {
        setAdjustDialogProduct(product);
        setIsAdjustDialogOpen(true);
      }
      onAction?.(action, product);
    },
    [onAction]
  );

  const hasPropProducts = propProducts !== undefined;
  const {
    data: fetchedProducts,
    isLoading: queryLoading,
    isError: queryError,
  } = useGetProducts({ enabled: !hasPropProducts });

  const allProducts = useMemo(() => {
    return propProducts ?? fetchedProducts ?? [];
  }, [propProducts, fetchedProducts]);

  const isLoading =
    propIsLoading !== undefined
      ? propIsLoading
      : !hasPropProducts && queryLoading;
  const isError =
    propIsError !== undefined ? propIsError : !hasPropProducts && queryError;

  // Filter products by classification tab and search term
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Classification filter
      if (
        classificationFilter === 'sale' &&
        (product.type !== 'sale' || product.is_bundle)
      ) {
        return false;
      }
      if (
        classificationFilter === 'rent' &&
        (product.type !== 'rent' || product.is_bundle)
      ) {
        return false;
      }
      if (classificationFilter === 'service' && product.type !== 'service') {
        return false;
      }
      if (classificationFilter === 'bundle' && !product.is_bundle) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = product.name?.toLowerCase().includes(query);
        const descMatch = product.description?.toLowerCase().includes(query);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allProducts, classificationFilter, searchTerm]);

  const columns = useMemo(
    () => [
      {
        id: 'image',
        header: () => <span className="sr-only">Imagem</span>,
        cell: ({ row }) => {
          const product = row.original;
          const imageSrc = product.images?.[0];

          return (
            <div className="size-11 shrink-0 overflow-hidden rounded-lg border bg-muted/40 flex items-center justify-center">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <PackageIcon className="size-5 text-muted-foreground/60" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Produto
            <ArrowUpDown className="ml-1.5 size-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex flex-col gap-0.5 max-w-[280px] sm:max-w-[360px]">
              <span className="font-semibold text-foreground leading-snug truncate">
                {product.name}
              </span>
              {product.description && (
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {product.description}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'classification',
        header: 'Classificação',
        cell: ({ row }) => {
          const product = row.original;

          if (product.is_bundle) {
            return (
              <Badge
                variant="secondary"
                className="gap-1 bg-primary/10 text-primary border-primary/20 font-medium whitespace-nowrap"
              >
                <BoxesIcon className="size-3 shrink-0" />
                Pacote Virtual
              </Badge>
            );
          }

          if (product.type === 'rent') {
            return (
              <Badge
                variant="outline"
                className="border-sky-500/30 text-sky-700 dark:text-sky-400 bg-sky-500/10 font-medium whitespace-nowrap"
              >
                Aluguel
              </Badge>
            );
          }

          if (product.type === 'sale') {
            return (
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 font-medium whitespace-nowrap"
              >
                Venda
              </Badge>
            );
          }

          return (
            <Badge
              variant="outline"
              className="border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 font-medium whitespace-nowrap"
            >
              Serviço
            </Badge>
          );
        },
      },
      {
        accessorKey: 'price',
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Preço Unitário
            <ArrowUpDown className="ml-1.5 size-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const price = row.original.price;
          return (
            <span className="font-medium text-foreground whitespace-nowrap">
              {formatCurrency(Number(price ?? 0))}
            </span>
          );
        },
      },
      {
        id: 'stock',
        header: 'Estoque Disponível',
        cell: ({ row }) => {
          const product = row.original;

          if (product.type === 'service') {
            return (
              <span className="text-muted-foreground text-xs font-normal">
                Não se aplica
              </span>
            );
          }

          if (product.is_bundle) {
            return (
              <BundleBottleneckPopover
                bundle={product}
                allProducts={allProducts}
              />
            );
          }

          const available = getAvailableStock(product);
          const onHand = product.stock?.quantity ?? product.quantity ?? 0;
          const reserved = product.stock?.reserved ?? product.reserved ?? 0;

          if (available === 0) {
            return (
              <Badge
                variant="destructive"
                className="font-medium whitespace-nowrap"
              >
                Esgotado
              </Badge>
            );
          }

          return (
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-foreground">
                {available} un
              </span>
              <span className="text-[11px] text-muted-foreground">
                ({onHand} total, {reserved} res.)
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Ações</span>,
        cell: ({ row }) => (
          <CatalogRowActions
            product={row.original}
            onAction={handleRowAction}
          />
        ),
      },
    ],
    [allProducts, handleRowAction]
  );

  const table = useTable({
    key: tableKey,
    features,
    data: filteredProducts,
    columns,
    getRowId: (row, index) => row.id ?? index.toString(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Category Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={classificationFilter}
          onValueChange={setClassificationFilter}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 sm:flex sm:h-9">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="sale">Venda</TabsTrigger>
            <TabsTrigger value="rent">Aluguel</TabsTrigger>
            <TabsTrigger value="service">Serviço</TabsTrigger>
            <TabsTrigger value="bundle">Pacote Virtual</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produtos por nome..."
            className="pl-9 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Main Catalog Data Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold">
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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2Icon className="size-6 animate-spin text-primary" />
                    <span className="text-xs">Carregando catálogo...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5 text-destructive py-6">
                    <p className="text-sm font-semibold">
                      Erro ao carregar o catálogo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Não foi possível carregar os produtos. Tente recarregar a
                      página.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
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
                  colSpan={columns.length}
                  className="h-44 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground py-6">
                    <PackageSearchIcon className="size-9 stroke-1 text-muted-foreground/60" />
                    <p className="text-sm font-semibold text-foreground">
                      Nenhum produto encontrado
                    </p>
                    <p className="text-xs max-w-sm text-center">
                      Tente buscar por outro termo ou selecione outra aba de
                      classificação.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-muted-foreground">
          <span>
            Página {table.getState().pagination.pageIndex + 1} de{' '}
            {table.getPageCount()} ({filteredProducts.length} itens no total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 text-xs"
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 text-xs"
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Dialog */}
      <StockAdjustDialog
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
        product={adjustDialogProduct}
      />
    </div>
  );
};

export default CatalogTable;
