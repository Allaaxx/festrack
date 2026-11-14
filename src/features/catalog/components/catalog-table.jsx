import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  AlertCircleIcon,
  ArrowUpDown,
  BoxIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns2Icon,
  GripVerticalIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PackageIcon,
  PackageSearchIcon,
  PencilIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react';

import { SearchForm } from '@/components/layout';
import ConfirmDeleteDialog from '@/components/shared/confirm-delete-dialog';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useDeleteProduct,
  useGetProducts,
} from '@/features/catalog/api/products';
import BundleBottleneckPopover from '@/features/catalog/components/bundle-bottleneck-popover';
import CreateProductDialog from '@/features/catalog/components/create-product-dialog';
import StockAdjustDialog from '@/features/catalog/components/stock-adjust-dialog';
import { getAvailableStock } from '@/features/catalog/helpers/bundle';
import { formatCurrency } from '@/helpers/currency';
import { useIsMobile } from '@/hooks/use-mobile';
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

const columnLabels = {
  image: 'Imagem',
  name: 'Produto',
  classification: 'Classificação',
  price: 'Preço Unitário',
  stock: 'Estoque Disponível',
};

const CATEGORY_FILTER_LABELS = {
  all: 'Todos',
  sale: 'Venda',
  rent: 'Aluguel',
  service: 'Serviço',
  bundle: 'Pacote',
};

const STOCK_STATUS_FILTER_LABELS = {
  all: 'Todos os status',
  available: 'Disponível',
  low_stock: 'Baixo Estoque',
  out_of_stock: 'Esgotado',
};

const SortableRowContext = createContext({
  attributes: {},
  listeners: undefined,
  onMoveRow: undefined,
});

const CatalogClassificationBadge = ({ product }) => {
  if (product?.is_bundle) {
    return (
      <Badge
        variant="secondary"
        className="gap-1 border-primary/20 bg-primary/10 font-medium whitespace-nowrap text-primary"
      >
        <BoxIcon className="size-3 shrink-0" />
        Pacote
      </Badge>
    );
  }

  if (product?.type === 'rent') {
    return (
      <Badge
        variant="outline"
        className="border-sky-500/30 bg-sky-500/10 font-medium whitespace-nowrap text-sky-700 dark:text-sky-400"
      >
        Aluguel
      </Badge>
    );
  }

  if (product?.type === 'sale') {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 font-medium whitespace-nowrap text-emerald-700 dark:text-emerald-400"
      >
        Venda
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-amber-500/30 bg-amber-500/10 font-medium whitespace-nowrap text-amber-700 dark:text-amber-400"
    >
      Serviço
    </Badge>
  );
};

const DragHandle = ({ product }) => {
  const { attributes, listeners, onMoveRow } = useContext(SortableRowContext);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      onMoveRow?.(product.id, 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      onMoveRow?.(product.id, -1);
      return;
    }
    listeners?.onKeyDown?.(event);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:bg-transparent size-7 cursor-grab active:cursor-grabbing"
      aria-label={`Reordenar ${product.name}`}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
    >
      <GripVerticalIcon className="text-muted-foreground size-4" />
      <span className="sr-only">Reordenar {product.name}</span>
    </Button>
  );
};

/**
 * Renders contextual action menu items for a catalog item:
 * - Editar (opens prefilled CreateProductDialog)
 * - Ajustar Estoque (for simple non-service products)
 * - Excluir (opens ConfirmDeleteDialog)
 */
const CatalogRowActions = ({ product, onAction }) => {
  const isBundle = Boolean(product.is_bundle);
  const isService = product.type === 'service';
  const canAdjustStock = !isBundle && !isService;

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
              className="text-muted-foreground hover:text-foreground size-8 cursor-pointer"
              aria-label={`Ações para ${product.name}`}
            >
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">Ações para {product.name}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onAction?.('edit', product)}>
            <PencilIcon className="text-muted-foreground mr-2 size-4" />
            Editar
          </DropdownMenuItem>
          {canAdjustStock && (
            <DropdownMenuItem
              onClick={() => onAction?.('adjust-stock', product)}
            >
              <SlidersHorizontalIcon className="text-muted-foreground mr-2 size-4" />
              Ajustar Estoque
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onAction?.('delete', product)}
          >
            <Trash2Icon className="mr-2 size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const SortableCatalogRow = ({ row, onRowClick, onMoveRow }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const contextValue = useMemo(
    () => ({ attributes, listeners, onMoveRow }),
    [attributes, listeners, onMoveRow]
  );

  return (
    <SortableRowContext.Provider value={contextValue}>
      <TableRow
        ref={setNodeRef}
        style={style}
        data-testid="catalog-row"
        data-dragging={isDragging || undefined}
        className={cn(
          'hover:bg-muted/40 relative z-0 cursor-pointer transition-colors',
          isDragging && 'bg-muted/80 z-10 opacity-80 shadow-md'
        )}
        onClick={() => onRowClick(row.original)}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            className="py-3"
            onClick={(e) => {
              if (
                cell.column.id === 'actions' ||
                cell.column.id === 'drag' ||
                (cell.column.id === 'stock' && row.original.is_bundle)
              ) {
                e.stopPropagation();
              }
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </SortableRowContext.Provider>
  );
};

/**
 * Catalog Table component displaying products, classification badges,
 * dynamic bottleneck stock calculations for bundles, drag-and-drop row reordering,
 * combined search/category/stock status filters, column customizer, and full CRUD.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.products] - Products directory list.
 * @param {boolean} [props.isLoading] - Loading state indicator.
 * @param {boolean} [props.isError] - Error state indicator.
 * @param {Function} [props.refetch] - Refetch callback on error.
 * @param {Function} [props.onAction] - Contextual action dispatcher callback.
 * @param {string} [props.className] - Container CSS class names.
 */
const CatalogTable = ({
  products: propProducts,
  isLoading: propIsLoading,
  isError: propIsError,
  refetch: propRefetch,
  onAction,
  className,
}) => {
  const tableKey = useId();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [orderedIds, setOrderedIds] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editDialogProduct, setEditDialogProduct] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [adjustDialogProduct, setAdjustDialogProduct] = useState(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [deleteDialogProduct, setDeleteDialogProduct] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteProductMutation = useDeleteProduct();

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const handleRowAction = useCallback(
    (action, product) => {
      if (action === 'edit') {
        setEditDialogProduct(product);
        setIsEditDialogOpen(true);
      } else if (action === 'adjust-stock') {
        setAdjustDialogProduct(product);
        setIsAdjustDialogOpen(true);
      } else if (action === 'delete') {
        setDeleteDialogProduct(product);
        setIsDeleteDialogOpen(true);
      }
      onAction?.(action, product);
    },
    [onAction]
  );

  const handleConfirmDelete = async () => {
    if (!deleteDialogProduct?.id) return;
    try {
      await deleteProductMutation.mutateAsync({ id: deleteDialogProduct.id });
      setIsDeleteDialogOpen(false);
      if (selectedProduct?.id === deleteDialogProduct.id) {
        setSelectedProduct(null);
      }
      setDeleteDialogProduct(null);
    } catch {
      // Error toast is handled by useDeleteProduct hook
    }
  };

  const hasPropProducts = propProducts !== undefined;
  const {
    data: fetchedProducts,
    isLoading: queryLoading,
    isError: queryError,
    refetch: queryRefetch,
  } = useGetProducts({ enabled: !hasPropProducts });

  const allProducts = useMemo(() => {
    return propProducts ?? fetchedProducts ?? [];
  }, [propProducts, fetchedProducts]);

  const orderedProducts = useMemo(() => {
    if (orderedIds.length === 0) {
      return allProducts;
    }
    const orderIndexMap = new Map(orderedIds.map((id, idx) => [id, idx]));
    return [...allProducts].sort((a, b) => {
      const idxA = orderIndexMap.has(a.id)
        ? orderIndexMap.get(a.id)
        : Number.MAX_SAFE_INTEGER;
      const idxB = orderIndexMap.has(b.id)
        ? orderIndexMap.get(b.id)
        : Number.MAX_SAFE_INTEGER;
      return idxA - idxB;
    });
  }, [allProducts, orderedIds]);

  const isLoading =
    propIsLoading !== undefined
      ? propIsLoading
      : !hasPropProducts && queryLoading;
  const isError =
    propIsError !== undefined ? propIsError : !hasPropProducts && queryError;
  const refetch = propRefetch ?? queryRefetch;

  // Filter products by classification, stock status, and search term
  const filteredProducts = useMemo(() => {
    return orderedProducts.filter((product) => {
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

      // Stock status filter
      if (stockStatusFilter !== 'all') {
        const available = getAvailableStock(product, allProducts);
        const isService = product.type === 'service';

        if (stockStatusFilter === 'available') {
          if (!isService && (available === null || available <= 0)) {
            return false;
          }
        } else if (stockStatusFilter === 'low_stock') {
          if (
            isService ||
            available === null ||
            available <= 0 ||
            available > 3
          ) {
            return false;
          }
        } else if (stockStatusFilter === 'out_of_stock') {
          if (isService || available !== 0) {
            return false;
          }
        }
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
  }, [
    orderedProducts,
    allProducts,
    classificationFilter,
    stockStatusFilter,
    searchTerm,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / pagination.pageSize)
  );
  const effectivePageIndex = Math.min(
    Math.max(0, pagination.pageIndex),
    Math.max(0, totalPages - 1)
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentIds = orderedProducts.map((item) => item.id);
      const oldIndex = currentIds.indexOf(active.id);
      const newIndex = currentIds.indexOf(over.id);

      if (oldIndex >= 0 && newIndex >= 0) {
        const nextIds = arrayMove(currentIds, oldIndex, newIndex);
        setOrderedIds(nextIds);
        onAction?.('reorder', nextIds);
      }
    },
    [orderedProducts, onAction]
  );

  const handleMoveRow = useCallback(
    (productId, delta) => {
      const currentIds = orderedProducts.map((item) => item.id);
      const oldIndex = currentIds.indexOf(productId);
      const newIndex = oldIndex + delta;

      if (oldIndex >= 0 && newIndex >= 0 && newIndex < currentIds.length) {
        const nextIds = arrayMove(currentIds, oldIndex, newIndex);
        setOrderedIds(nextIds);
        onAction?.('reorder', nextIds);
      }
    },
    [orderedProducts, onAction]
  );

  const columns = useMemo(
    () => [
      {
        id: 'drag',
        enableHiding: false,
        header: () => <span className="sr-only">Reordenar</span>,
        cell: ({ row }) => <DragHandle product={row.original} />,
      },
      {
        id: 'image',
        header: () => <span className="sr-only">Imagem</span>,
        cell: ({ row }) => {
          const product = row.original;
          const imageSrc = product.images?.[0];

          return (
            <div className="bg-muted/40 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <PackageIcon className="text-muted-foreground/60 size-5" />
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
            className="text-muted-foreground hover:text-foreground -ml-3 h-8 text-xs font-semibold"
          >
            Produto
            <ArrowUpDown className="ml-1.5 size-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex max-w-[280px] flex-col gap-0.5 sm:max-w-[360px]">
              <span className="text-foreground truncate leading-snug font-semibold">
                {product.name}
              </span>
              {product.description && (
                <span className="text-muted-foreground line-clamp-1 text-xs">
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
        cell: ({ row }) => <CatalogClassificationBadge product={row.original} />,
      },
      {
        accessorKey: 'price',
        header: ({ column }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="text-muted-foreground hover:text-foreground -ml-3 h-8 text-xs font-semibold"
          >
            Preço Unitário
            <ArrowUpDown className="ml-1.5 size-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const price = row.original.price;
          return (
            <span className="text-foreground font-medium whitespace-nowrap">
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
              <span className="text-foreground font-semibold">
                {available} un
              </span>
              <span className="text-muted-foreground text-[11px]">
                ({onHand} total, {reserved} res.)
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
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
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnVisibility,
      pagination: {
        pageIndex: effectivePageIndex,
        pageSize: pagination.pageSize,
      },
    },
  });

  const rows = table.getRowModel().rows;
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const filteredRowsCount = filteredProducts.length;
  const currentPage = effectivePageIndex + 1;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <section
      data-testid="catalog-table-section"
      className={cn('flex w-full flex-col justify-start gap-4', className)}
    >
      {/* Top Toolbar: [SearchForm] [Category Select] [Stock Status Select] | [Personalizar Colunas] [+ Adicionar produto] */}
      <div className="flex flex-col-reverse items-center justify-between gap-2 lg:flex-row">
        <div className="flex w-full flex-col items-center gap-2 sm:flex-row lg:w-fit">
          <SearchForm
            id="search-catalog-products"
            placeholder="Buscar produtos por nome..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="w-full sm:w-64"
          />

          <Select
            value={classificationFilter}
            onValueChange={(value) => {
              setClassificationFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger
              size="sm"
              aria-label="Filtrar por categoria"
              className="h-8 w-full sm:w-40"
            >
              <SelectValue placeholder="Todas as categorias">
                {CATEGORY_FILTER_LABELS[classificationFilter] ?? 'Todos'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sale">Venda</SelectItem>
              <SelectItem value="rent">Aluguel</SelectItem>
              <SelectItem value="service">Serviço</SelectItem>
              <SelectItem value="bundle">Pacote</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={stockStatusFilter}
            onValueChange={(value) => {
              setStockStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger
              size="sm"
              aria-label="Filtrar por status de estoque"
              className="h-8 w-full sm:w-44"
            >
              <SelectValue placeholder="Todos os status">
                {STOCK_STATUS_FILTER_LABELS[stockStatusFilter] ??
                  'Todos os status'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="low_stock">Baixo Estoque</SelectItem>
              <SelectItem value="out_of_stock">Esgotado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full flex-col items-center gap-2 sm:flex-row lg:w-fit">
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
                    column.id !== 'drag' &&
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

          <CreateProductDialog
            trigger={
              <Button size="sm" className="w-full cursor-pointer sm:w-fit">
                <PlusIcon className="size-4" />
                Adicionar produto
              </Button>
            }
          />
        </div>
      </div>

      {/* Main Catalog Data Table + Pagination */}
      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers
                      .filter((header) => header.column.getIsVisible())
                      .map((header) => (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          className="text-xs font-semibold"
                        >
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
                {isLoading ? (
                  <TableRow data-testid="catalog-loading">
                    <TableCell
                      colSpan={visibleColumnCount}
                      className="h-40 text-center"
                    >
                      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <Loader2Icon className="text-primary size-6 animate-spin" />
                        <span className="text-xs">Carregando catálogo...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow data-testid="catalog-error">
                    <TableCell
                      colSpan={visibleColumnCount}
                      className="h-40 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                        <AlertCircleIcon className="text-muted-foreground size-8" />
                        <div className="space-y-1">
                          <p className="text-destructive text-sm font-semibold">
                            Erro ao carregar o catálogo
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Não foi possível carregar os produtos. Tente
                            novamente.
                          </p>
                        </div>
                        {refetch && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                          >
                            Tentar novamente
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows?.length ? (
                  <SortableContext
                    items={rowIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {rows.map((row) => (
                      <SortableCatalogRow
                        key={row.id}
                        row={row}
                        onRowClick={setSelectedProduct}
                        onMoveRow={handleMoveRow}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumnCount}
                      className="h-44 text-center"
                    >
                      <div className="text-muted-foreground flex flex-col items-center justify-center gap-1.5 py-6">
                        <PackageSearchIcon className="text-muted-foreground/60 size-9 stroke-1" />
                        <p className="text-foreground text-sm font-semibold">
                          Nenhum produto encontrado
                        </p>
                        <p className="max-w-sm text-center text-xs">
                          Tente buscar por outro termo ou ajuste os filtros de
                          categoria e status de estoque.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        {/* Pagination Footer matching TransactionsTable */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            Exibindo {rows.length} de {filteredRowsCount} produto(s).
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label
                htmlFor="catalog-rows-per-page"
                className="text-sm font-medium"
              >
                Linhas por página
              </Label>
              <Select
                value={`${table.state.pagination.pageSize}`}
                disabled={!filteredRowsCount}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="w-20"
                  id="catalog-rows-per-page"
                >
                  <SelectValue placeholder={table.state.pagination.pageSize}>
                    {table.state.pagination.pageSize}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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

      {/* Product Details Drawer */}
      <Drawer
        direction={isMobile ? 'bottom' : 'right'}
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>Detalhes do Produto</DrawerTitle>
            <DrawerDescription>
              {selectedProduct?.name
                ? `Informações completas de ${selectedProduct.name}.`
                : 'Informações completas do item selecionado.'}
            </DrawerDescription>
          </DrawerHeader>

          {selectedProduct && (
            <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
              <Separator />
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Produto</span>
                  <span className="font-medium">{selectedProduct.name}</span>
                </div>
                {selectedProduct.description && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Descrição</span>
                      <span className="text-right">
                        {selectedProduct.description}
                      </span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Classificação</span>
                  <CatalogClassificationBadge product={selectedProduct} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preço Unitário</span>
                  <span className="font-semibold">
                    {formatCurrency(Number(selectedProduct.price ?? 0))}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Estoque Disponível
                  </span>
                  <span className="font-medium">
                    {selectedProduct.type === 'service'
                      ? 'Não se aplica'
                      : `${getAvailableStock(selectedProduct, allProducts)} un`}
                  </span>
                </div>
              </div>
              <Separator />
            </div>
          )}

          <DrawerFooter>
            {selectedProduct && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const target = selectedProduct;
                    setSelectedProduct(null);
                    handleRowAction('edit', target);
                  }}
                >
                  <PencilIcon className="mr-2 size-4" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const target = selectedProduct;
                    setSelectedProduct(null);
                    handleRowAction('delete', target);
                  }}
                >
                  <Trash2Icon className="mr-2 size-4" />
                  Excluir
                </Button>
              </>
            )}
            <DrawerClose render={<Button variant="outline">Fechar</Button>} />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Product / Bundle Dialog */}
      <CreateProductDialog
        product={editDialogProduct}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        trigger={null}
      />

      {/* Manual Stock Adjustment Dialog */}
      <StockAdjustDialog
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
        product={adjustDialogProduct}
      />

      {/* Delete Product Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir produto"
        description={
          deleteDialogProduct?.name
            ? `Tem certeza que deseja excluir "${deleteDialogProduct.name}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.'
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        isPending={deleteProductMutation.isPending}
      />
    </section>
  );
};

export default CatalogTable;
