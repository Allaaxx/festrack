import {
  ArrowUpDownIcon,
  BoxIcon,
  CalendarClockIcon,
  PackageIcon,
  ShoppingBagIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShopContext } from '@/contexts/shop';
import { getAvailableStock } from '@/features/catalog/helpers/bundle';
import { formatCurrency } from '@/helpers/currency';
import { cn } from '@/lib/utils';

const DISTRIBUTION_CATEGORIES = [
  { id: 'rent', label: 'Aluguel', Icon: CalendarClockIcon },
  { id: 'sale', label: 'Venda', Icon: ShoppingBagIcon },
  { id: 'bundle', label: 'Pacote', Icon: BoxIcon },
];

const getShopInitial = (name) => {
  if (!name || typeof name !== 'string') return 'L';
  return name.trim().charAt(0).toUpperCase() || 'L';
};

const getProductClassificationLabel = (product) => {
  if (product?.is_bundle) return 'Pacote';
  if (product?.type === 'rent') return 'Aluguel';
  if (product?.type === 'service') return 'Serviço';
  return 'Venda';
};

const normalizeMovementsList = (movements, products = []) => {
  const rawList = Array.isArray(movements)
    ? movements
    : Array.isArray(movements?.movements)
      ? movements.movements
      : Array.isArray(movements?.items)
        ? movements.items
        : [];

  if (rawList.length === 0) {
    return [];
  }

  const safeProducts = Array.isArray(products) ? products : [];
  const productByNameOrId = new Map();
  for (const prod of safeProducts) {
    if (prod?.id) productByNameOrId.set(prod.id, prod);
    if (prod?.name) productByNameOrId.set(prod.name, prod);
  }

  return rawList.map((item, idx) => {
    const rawType = String(item?.type || 'INBOUND').toUpperCase();
    const rawQty = Math.abs(Number(item?.quantity ?? item?.quantityDelta ?? 0));
    const matchedProduct =
      productByNameOrId.get(item?.productId ?? item?.product_id) ||
      productByNameOrId.get(item?.productName);

    const productName =
      item?.productName ||
      item?.product?.name ||
      matchedProduct?.name ||
      'Produto do Catálogo';

    const classification = matchedProduct
      ? getProductClassificationLabel(matchedProduct)
      : item?.classification || 'Catálogo';
    const slug =
      item?.slug ||
      item?.productSlug ||
      matchedProduct?.slug ||
      'item-catalogo';
    const productSubtitle = `${classification} • ${slug}`;

    let bucket = 'inbound';
    let statusTitle = `+${rawQty} un • Entrada em estoque`;

    if (
      rawType === 'RENTAL_ALLOCATION' ||
      rawType === 'RESERVATION' ||
      rawType === 'RESERVED' ||
      rawType === 'RESERVA' ||
      rawType === 'ALLOCATION'
    ) {
      bucket = 'reserved';
      statusTitle = `${rawQty} un • Reservado em evento`;
    } else if (
      rawType === 'LOSS' ||
      rawType === 'SALE' ||
      rawType === 'OUTBOUND' ||
      rawType === 'BAIXA' ||
      rawType === 'DAMAGE' ||
      (rawType === 'ADJUSTMENT' &&
        Number(item?.quantity ?? item?.quantityDelta ?? 0) < 0)
    ) {
      bucket = 'outbound';
      statusTitle = `-${rawQty} un • Baixa de estoque`;
    }

    const noteSubtitle =
      item?.note ||
      item?.notes ||
      item?.reason ||
      'Movimentação registrada no estoque';

    return {
      id: item?.id || `mov-${idx}`,
      bucket,
      productName,
      productSubtitle,
      statusTitle,
      noteSubtitle,
    };
  });
};

export function ShopDistributionCard({
  products = [],
  shopName,
  isLoading = false,
}) {
  const { activeShop } = useShopContext() || {};
  const [selectedCategory, setSelectedCategory] = useState('rent');

  const resolvedShopName = shopName || activeShop?.name || 'Minha Loja';
  const shopLogo =
    activeShop?.imageUrl ||
    activeShop?.image ||
    activeShop?.logoUrl ||
    (typeof activeShop?.logo === 'string' ? activeShop?.logo : null);
  const ActiveLogo =
    typeof activeShop?.logo === 'function' ? activeShop?.logo : null;

  const breakdown = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const categoryProducts = safeProducts.filter((product) => {
      if (selectedCategory === 'bundle') {
        return Boolean(product?.is_bundle);
      }
      return !product?.is_bundle && product?.type === selectedCategory;
    });

    let availableUnits = 0;
    let reservedUnits = 0;
    let exhaustedCount = 0;

    for (const product of categoryProducts) {
      const available = Number(getAvailableStock(product, safeProducts) ?? 0);
      const reserved = Number(
        product?.stock?.reserved ?? product?.reserved ?? 0
      );

      availableUnits += available;
      reservedUnits += reserved;

      if (available <= 0) {
        exhaustedCount += 1;
      }
    }

    const totalUnits = availableUnits + reservedUnits;
    const totalItems = categoryProducts.length;

    const availablePct =
      totalUnits > 0 ? Math.round((availableUnits / totalUnits) * 100) : 0;
    const reservedPct =
      totalUnits > 0 ? Math.round((reservedUnits / totalUnits) * 100) : 0;
    const exhaustedPct =
      totalItems > 0 ? Math.round((exhaustedCount / totalItems) * 100) : 0;

    return {
      totalUnits,
      availableUnits,
      reservedUnits,
      exhaustedCount,
      availablePct,
      reservedPct,
      exhaustedPct,
    };
  }, [products, selectedCategory]);

  return (
    <Card
      data-testid="shop-distribution-card"
      aria-busy={isLoading}
      className="@container/card flex flex-col justify-between"
    >
      <CardContent className="flex flex-1 flex-col gap-5 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="lg" className="rounded-xl after:rounded-xl">
              {shopLogo ? (
                <AvatarImage
                  src={shopLogo}
                  alt={resolvedShopName}
                  className="rounded-xl"
                />
              ) : null}
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-xl text-base font-semibold">
                {ActiveLogo ? (
                  <ActiveLogo className="size-5" />
                ) : (
                  <span>{getShopInitial(resolvedShopName)}</span>
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-heading truncate text-base leading-tight font-semibold">
                {resolvedShopName}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                Catálogo da Loja
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton
              data-testid="operational-grid-skeleton"
              className="h-9 w-36"
            />
            <Skeleton className="h-9 w-full rounded-lg" />
            <div className="flex flex-col gap-3 pt-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums">
                  {breakdown.totalUnits}
                </span>
                <span className="text-muted-foreground text-sm">Unidades</span>
              </div>

              <div
                role="tablist"
                aria-label="Categorias de distribuição da loja"
                className="bg-muted/60 grid grid-cols-3 gap-1 rounded-lg p-1"
              >
                {DISTRIBUTION_CATEGORIES.map(({ id, label, Icon }) => {
                  const isSelected = selectedCategory === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedCategory(id)}
                      className={cn(
                        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-background text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-1">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Disponível</span>
                  <span className="text-muted-foreground tabular-nums">
                    {breakdown.availableUnits}
                  </span>
                </div>
                <Progress
                  value={breakdown.availablePct}
                  aria-label="Disponível"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Reservado</span>
                  <span className="text-muted-foreground tabular-nums">
                    {breakdown.reservedUnits}
                  </span>
                </div>
                <Progress
                  value={breakdown.reservedPct}
                  aria-label="Reservado"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Esgotado</span>
                  <span className="text-muted-foreground tabular-nums">
                    {breakdown.exhaustedCount}
                  </span>
                </div>
                <Progress value={breakdown.exhaustedPct} aria-label="Esgotado">
                  <ProgressTrack>
                    <ProgressIndicator className="bg-destructive" />
                  </ProgressTrack>
                </Progress>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const MovementTimelineNodeList = ({ items = [] }) => {
  if (!items.length) {
    return (
      <div className="text-muted-foreground flex min-h-48 items-center justify-center py-8 text-center text-xs">
        Nenhuma movimentação registrada nesta categoria.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      {items.slice(0, 2).map((item, index, slice) => (
        <div key={item.id} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="text-muted-foreground flex size-5 shrink-0 items-center justify-center">
                  <PackageIcon className="size-4" />
                </div>
                <div className="border-border my-1 min-h-7 w-px flex-1 border-l border-dashed" />
              </div>
              <div className="min-w-0 pb-3">
                <p className="text-muted-foreground text-xs">Produto</p>
                <p className="truncate text-sm font-semibold">
                  {item.productName}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {item.productSubtitle}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="text-muted-foreground flex size-5 shrink-0 items-center justify-center">
                  <ArrowUpDownIcon className="size-4" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Registro</p>
                <p className="truncate text-sm font-semibold">
                  {item.statusTitle}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {item.noteSubtitle}
                </p>
              </div>
            </div>
          </div>

          {index < slice.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
};

export function StockMovementsTimelineCard({
  products = [],
  movements,
  isLoading = false,
}) {
  const normalizedMovements = useMemo(
    () => normalizeMovementsList(movements, products),
    [movements, products]
  );

  const grouped = useMemo(() => {
    return {
      inbound: normalizedMovements.filter((m) => m.bucket === 'inbound'),
      reserved: normalizedMovements.filter((m) => m.bucket === 'reserved'),
      outbound: normalizedMovements.filter((m) => m.bucket === 'outbound'),
    };
  }, [normalizedMovements]);

  return (
    <Card
      data-testid="stock-movements-timeline-card"
      aria-busy={isLoading}
      className="@container/card flex flex-col"
    >
      <CardHeader>
        <CardTitle>Movimentações de Estoque</CardTitle>
        <CardDescription>
          {normalizedMovements.length} movimentações registradas
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton
              data-testid="operational-grid-skeleton"
              className="h-8 w-full"
            />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="inbound" className="w-full">
            <TabsList
              variant="line"
              className="border-border w-full justify-between border-b px-0 pb-1"
            >
              <TabsTrigger value="inbound">Entradas</TabsTrigger>
              <TabsTrigger value="reserved">Reservas</TabsTrigger>
              <TabsTrigger value="outbound">Baixas</TabsTrigger>
            </TabsList>

            <TabsContent value="inbound">
              <MovementTimelineNodeList items={grouped.inbound} />
            </TabsContent>
            <TabsContent value="reserved">
              <MovementTimelineNodeList items={grouped.reserved} />
            </TabsContent>
            <TabsContent value="outbound">
              <MovementTimelineNodeList items={grouped.outbound} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

const resolveProductImage = (product) => {
  if (!product) return null;
  if (typeof product.image_url === 'string' && product.image_url) {
    return product.image_url;
  }
  if (typeof product.imageUrl === 'string' && product.imageUrl) {
    return product.imageUrl;
  }
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    return typeof first === 'string' ? first : (first?.url ?? null);
  }
  return null;
};

export function PopularProductsCard({ products = [], isLoading = false }) {
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  const topProducts = useMemo(() => {
    return [...safeProducts]
      .sort((a, b) => {
        const reservedA = Number(a?.stock?.reserved ?? a?.reserved ?? 0);
        const reservedB = Number(b?.stock?.reserved ?? b?.reserved ?? 0);
        if (reservedB !== reservedA) {
          return reservedB - reservedA;
        }
        const valueA =
          Number(a?.price ?? 0) *
          Math.max(1, Number(a?.stock?.quantity ?? a?.quantity ?? 1));
        const valueB =
          Number(b?.price ?? 0) *
          Math.max(1, Number(b?.stock?.quantity ?? b?.quantity ?? 1));
        return valueB - valueA;
      })
      .slice(0, 5);
  }, [safeProducts]);

  return (
    <Card
      data-testid="popular-products-card"
      aria-busy={isLoading}
      className="@container/card flex flex-col"
    >
      <CardHeader>
        <CardTitle>Produtos Populares</CardTitle>
        <CardDescription>
          Total de {safeProducts.length} itens no catálogo
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton
              data-testid="operational-grid-skeleton"
              className="h-10 w-full"
            />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : topProducts.length === 0 ? (
          <div className="text-muted-foreground flex min-h-48 items-center justify-center py-8 text-center text-xs">
            Nenhum produto cadastrado na loja.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {topProducts.map((product) => {
              const imageUrl = resolveProductImage(product);
              const reserved = Number(
                product?.stock?.reserved ?? product?.reserved ?? 0
              );
              const available = Number(
                getAvailableStock(product, safeProducts) ?? 0
              );
              const metricLabel =
                reserved > 0 ? `${reserved} alocados` : `${available} disp.`;

              return (
                <div
                  key={product.id ?? product.name}
                  data-testid="popular-product-item"
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="bg-muted/40 size-10 shrink-0 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="bg-muted/40 text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border">
                        <BoxIcon className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm leading-tight font-semibold">
                        {product.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatCurrency(Number(product.price ?? 0))}
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-sm font-medium tabular-nums">
                    {metricLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CatalogOperationalGrid({
  products = [],
  movements,
  shopName,
  isLoading = false,
  className,
}) {
  return (
    <div
      data-testid="catalog-operational-grid"
      className={cn('grid grid-cols-1 gap-4 px-4 lg:grid-cols-3', className)}
    >
      <ShopDistributionCard
        products={products}
        shopName={shopName}
        isLoading={isLoading}
      />
      <StockMovementsTimelineCard
        products={products}
        movements={movements}
        isLoading={isLoading}
      />
      <PopularProductsCard products={products} isLoading={isLoading} />
    </div>
  );
}

export default CatalogOperationalGrid;
