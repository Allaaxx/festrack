import {
  AlertTriangleIcon,
  LayersIcon,
  Loader2Icon,
  PackageIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { NumericFormat } from 'react-number-format';

import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateProduct,
  useGetProducts,
  useUpdateProduct,
} from '@/features/catalog/api/products';
import {
  calculateBundleBottleneck,
  getAvailableStock,
} from '@/features/catalog/helpers/bundle';

const mapBundleItemsFromProduct = (product, availableSimpleProducts = []) => {
  const rawItems = product?.bundle_items ?? product?.bundleItems ?? [];
  return rawItems.map((bi) => {
    const compId = bi.product_id ?? bi.productId;
    const comp =
      bi.componentProduct ??
      bi.product ??
      availableSimpleProducts.find((p) => p.id === compId);
    const onHand = Number(comp?.stock?.quantity ?? comp?.quantity ?? 0);
    const reserved = Number(comp?.stock?.reserved ?? comp?.reserved ?? 0);
    const available = getAvailableStock(comp) ?? 0;

    return {
      productId: compId,
      name: comp?.name ?? bi.name ?? 'Componente',
      type: comp?.type ?? bi.type ?? 'rent',
      quantity: Number(bi.quantity ?? 1),
      onHand,
      reserved,
      availableStock: available,
      componentProduct: comp,
    };
  });
};

/**
 * Modal dialog for unified creation and editing of simple products and bundles (Pacotes).
 * Follows Base UI element composition standards without `asChild`.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.trigger]
 * @param {Object} [props.product]
 * @param {boolean} [props.open]
 * @param {(open: boolean) => void} [props.onOpenChange]
 * @param {(product: Object) => void} [props.onSuccess]
 */
const CreateProductDialog = ({
  trigger,
  product,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const isEditMode = Boolean(product?.id);
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? open : internalOpen;

  const { data: allProducts = [] } = useGetProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const availableSimpleProducts = useMemo(
    () => allProducts.filter((p) => !p.is_bundle && p.id !== product?.id),
    [allProducts, product?.id]
  );

  const [syncedProductId, setSyncedProductId] = useState(product?.id ?? null);
  const [activeTab, setActiveTab] = useState(
    product?.is_bundle ? 'bundle' : 'simple'
  );

  // Simple Product Form State
  const [name, setName] = useState(
    !product?.is_bundle ? (product?.name ?? '') : ''
  );
  const [description, setDescription] = useState(
    !product?.is_bundle ? (product?.description ?? '') : ''
  );
  const [type, setType] = useState(
    !product?.is_bundle ? (product?.type ?? 'rent') : 'rent'
  );
  const [price, setPrice] = useState(
    !product?.is_bundle &&
      product?.price !== undefined &&
      product?.price !== null
      ? Number(product.price)
      : ''
  );
  const [quantity, setQuantity] = useState(
    !product?.is_bundle
      ? String(product?.stock?.quantity ?? product?.quantity ?? 0)
      : '0'
  );
  const [simpleErrors, setSimpleErrors] = useState({});

  // Bundle Form State
  const [bundleName, setBundleName] = useState(
    product?.is_bundle ? (product?.name ?? '') : ''
  );
  const [bundleDescription, setBundleDescription] = useState(
    product?.is_bundle ? (product?.description ?? '') : ''
  );
  const [bundlePrice, setBundlePrice] = useState(
    product?.is_bundle &&
      product?.price !== undefined &&
      product?.price !== null
      ? Number(product.price)
      : ''
  );
  const [bundleItems, setBundleItems] = useState(() =>
    product?.is_bundle
      ? mapBundleItemsFromProduct(product, availableSimpleProducts)
      : []
  );
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [bundleErrors, setBundleErrors] = useState({});

  const applyProductState = (targetProduct) => {
    setSimpleErrors({});
    setBundleErrors({});
    setSelectedComponentId('');

    if (!targetProduct) {
      setActiveTab('simple');
      setName('');
      setDescription('');
      setType('rent');
      setPrice('');
      setQuantity('0');
      setBundleName('');
      setBundleDescription('');
      setBundlePrice('');
      setBundleItems([]);
      return;
    }

    if (targetProduct.is_bundle) {
      setActiveTab('bundle');
      setBundleName(targetProduct.name ?? '');
      setBundleDescription(targetProduct.description ?? '');
      setBundlePrice(
        targetProduct.price !== undefined && targetProduct.price !== null
          ? Number(targetProduct.price)
          : ''
      );
      setBundleItems(
        mapBundleItemsFromProduct(targetProduct, availableSimpleProducts)
      );
    } else {
      setActiveTab('simple');
      setName(targetProduct.name ?? '');
      setDescription(targetProduct.description ?? '');
      setType(targetProduct.type ?? 'rent');
      setPrice(
        targetProduct.price !== undefined && targetProduct.price !== null
          ? Number(targetProduct.price)
          : ''
      );
      setQuantity(
        String(targetProduct?.stock?.quantity ?? targetProduct?.quantity ?? 0)
      );
    }
  };

  if ((product?.id ?? null) !== syncedProductId) {
    setSyncedProductId(product?.id ?? null);
    applyProductState(product);
  }

  const simpleNameId = useId();
  const simpleDescId = useId();
  const simpleTypeId = useId();
  const simplePriceId = useId();
  const simpleStockId = useId();

  const bundleNameId = useId();
  const bundleDescId = useId();
  const bundlePriceId = useId();
  const bundlePickerId = useId();

  const isSubmitting =
    createProductMutation.isPending || updateProductMutation.isPending;

  const handleOpenChange = (nextOpen) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      applyProductState(product ?? null);
    } else if (product) {
      applyProductState(product);
    }
  };

  const handleAddComponent = () => {
    if (!selectedComponentId) return;

    const comp = availableSimpleProducts.find(
      (p) => p.id === selectedComponentId
    );
    if (!comp) return;

    const existingIndex = bundleItems.findIndex(
      (item) => item.productId === comp.id
    );

    if (existingIndex >= 0) {
      setBundleItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const onHand = Number(comp?.stock?.quantity ?? comp?.quantity ?? 0);
      const reserved = Number(comp?.stock?.reserved ?? comp?.reserved ?? 0);
      const available = getAvailableStock(comp) ?? 0;

      setBundleItems((prev) => [
        ...prev,
        {
          productId: comp.id,
          name: comp.name,
          type: comp.type,
          quantity: 1,
          onHand,
          reserved,
          availableStock: available,
          componentProduct: comp,
        },
      ]);
    }

    setSelectedComponentId('');
    setBundleErrors((prev) => ({ ...prev, items: undefined }));
  };

  const handleUpdateMultiplier = (productId, newQuantity) => {
    const value =
      newQuantity === '' ? '' : Math.max(1, parseInt(newQuantity, 10) || 1);
    setBundleItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: value } : item
      )
    );
  };

  const handleRemoveComponent = (productId) => {
    setBundleItems((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  };

  const bottleneckInfo = useMemo(() => {
    if (bundleItems.length === 0) return null;
    const bundleMock = {
      is_bundle: true,
      bundle_items: bundleItems.map((item) => ({
        product_id: item.productId,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
        componentProduct: item.componentProduct,
      })),
    };
    return calculateBundleBottleneck(bundleMock, availableSimpleProducts);
  }, [bundleItems, availableSimpleProducts]);

  const handleSubmitSimple = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!name.trim()) {
      errors.name = 'O nome é obrigatório.';
    }

    const parsedPrice = typeof price === 'number' ? price : parseFloat(price);
    if (price === '' || isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = 'O preço deve ser um valor válido.';
    }

    if (Object.keys(errors).length > 0) {
      setSimpleErrors(errors);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      type,
      price: parsedPrice,
      is_bundle: false,
    };

    if (type !== 'service') {
      const qty = parseInt(quantity, 10);
      payload.quantity = isNaN(qty) ? 0 : Math.max(0, qty);
      if (!isEditMode) {
        payload.initial_quantity = payload.quantity;
      }
    }

    try {
      const saved = isEditMode
        ? await updateProductMutation.mutateAsync({
            id: product.id,
            ...payload,
          })
        : await createProductMutation.mutateAsync(payload);
      handleOpenChange(false);
      onSuccess?.(saved);
    } catch {
      // Error handled by hook toast
    }
  };

  const handleSubmitBundle = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!bundleName.trim()) {
      errors.name = 'O nome é obrigatório.';
    }

    const parsedPrice =
      typeof bundlePrice === 'number' ? bundlePrice : parseFloat(bundlePrice);
    if (bundlePrice === '' || isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = 'O preço deve ser um valor válido.';
    }

    if (bundleItems.length === 0) {
      errors.items = 'Adicione pelo menos um componente ao pacote.';
    }

    if (Object.keys(errors).length > 0) {
      setBundleErrors(errors);
      return;
    }

    const payload = {
      name: bundleName.trim(),
      description: bundleDescription.trim() || null,
      type: 'rent',
      price: parsedPrice,
      is_bundle: true,
      bundle_items: bundleItems.map((item) => ({
        product_id: item.productId,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      })),
    };

    try {
      const saved = isEditMode
        ? await updateProductMutation.mutateAsync({
            id: product.id,
            ...payload,
          })
        : await createProductMutation.mutateAsync(payload);
      handleOpenChange(false);
      onSuccess?.(saved);
    } catch {
      // Error handled by hook toast
    }
  };

  const defaultTrigger = (
    <Button
      type="button"
      variant="secondary"
      className="bg-background text-foreground hover:bg-background/90 cursor-pointer shadow-sm"
    >
      <PlusIcon className="mr-1.5 size-4" />
      Novo Produto
    </Button>
  );

  const dialogTitle = isEditMode
    ? activeTab === 'bundle' || product?.is_bundle
      ? 'Editar Pacote'
      : 'Editar Produto'
    : 'Novo Produto';

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {(trigger || (!isEditMode && trigger !== null)) && (
        <DialogTrigger render={trigger || defaultTrigger} />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <PackageIcon className="text-primary size-5" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Atualize os dados do produto ou os componentes do pacote no catálogo da sua loja.'
              : 'Cadastre um produto simples ou componha um pacote dinâmico para o catálogo da sua loja.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="gap-2">
              <PackageIcon className="size-4" />
              Produto Simples
            </TabsTrigger>
            <TabsTrigger value="bundle" className="gap-2">
              <LayersIcon className="size-4" />
              Pacote
            </TabsTrigger>
          </TabsList>

          {/* Simple Product Tab */}
          <TabsContent value="simple" className="mt-4">
            <form onSubmit={handleSubmitSimple} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={simpleNameId}>Nome do Produto</Label>
                <Input
                  id={simpleNameId}
                  aria-label="Nome do Produto"
                  placeholder="Ex: Mesa Rústica Retangular 2m"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSimpleErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  aria-invalid={Boolean(simpleErrors.name)}
                />
                {simpleErrors.name && (
                  <p className="text-destructive text-xs font-medium">
                    {simpleErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={simpleDescId}>Descrição</Label>
                <Textarea
                  id={simpleDescId}
                  aria-label="Descrição"
                  placeholder="Detalhes opcionais, medidas, cuidados..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={simpleTypeId}>Classificação</Label>
                  <select
                    id={simpleTypeId}
                    aria-label="Classificação"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="border-input bg-background text-foreground focus-visible:ring-ring/50 flex h-9 w-full rounded-lg border px-3 py-1 text-sm shadow-xs outline-hidden transition-colors focus-visible:ring-3"
                  >
                    <option value="rent">Aluguel</option>
                    <option value="sale">Venda</option>
                    <option value="service">Serviço</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={simplePriceId}>Preço (R$)</Label>
                  <NumericFormat
                    id={simplePriceId}
                    aria-label="Preço do Produto"
                    customInput={Input}
                    placeholder="0,00"
                    prefix="R$ "
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    value={price}
                    onValueChange={(values) => {
                      setPrice(values.floatValue ?? '');
                      setSimpleErrors((prev) => ({
                        ...prev,
                        price: undefined,
                      }));
                    }}
                    aria-invalid={Boolean(simpleErrors.price)}
                  />
                  {simpleErrors.price && (
                    <p className="text-destructive text-xs font-medium">
                      {simpleErrors.price}
                    </p>
                  )}
                </div>
              </div>

              {type !== 'service' && (
                <div className="space-y-1.5">
                  <Label htmlFor={simpleStockId}>Estoque Inicial</Label>
                  <Input
                    id={simpleStockId}
                    aria-label="Estoque Inicial"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    Quantidade física disponível para pronta locação ou venda.
                  </p>
                </div>
              )}

              <DialogFooter className="mt-6 pt-2">
                <DialogClose
                  render={
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  }
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  )}
                  {isEditMode ? 'Salvar Alterações' : 'Criar Produto'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Bundle Tab */}
          <TabsContent value="bundle" className="mt-4">
            <form onSubmit={handleSubmitBundle} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={bundleNameId}>Nome do Pacote</Label>
                <Input
                  id={bundleNameId}
                  aria-label="Nome do Pacote"
                  placeholder="Ex: Pacote Provençal Rústico Luxo"
                  value={bundleName}
                  onChange={(e) => {
                    setBundleName(e.target.value);
                    setBundleErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  aria-invalid={Boolean(bundleErrors.name)}
                />
                {bundleErrors.name && (
                  <p className="text-destructive text-xs font-medium">
                    {bundleErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={bundleDescId}>Descrição do Pacote</Label>
                <Textarea
                  id={bundleDescId}
                  aria-label="Descrição do Pacote"
                  placeholder="Detalhes dos itens combinados no pacote..."
                  value={bundleDescription}
                  onChange={(e) => setBundleDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={bundlePriceId}>Preço do Pacote (R$)</Label>
                <NumericFormat
                  id={bundlePriceId}
                  aria-label="Preço do Pacote"
                  customInput={Input}
                  placeholder="0,00"
                  prefix="R$ "
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  fixedDecimalScale
                  allowNegative={false}
                  value={bundlePrice}
                  onValueChange={(values) => {
                    setBundlePrice(values.floatValue ?? '');
                    setBundleErrors((prev) => ({ ...prev, price: undefined }));
                  }}
                  aria-invalid={Boolean(bundleErrors.price)}
                />
                {bundleErrors.price && (
                  <p className="text-destructive text-xs font-medium">
                    {bundleErrors.price}
                  </p>
                )}
              </div>

              {/* Component Selector Section */}
              <div className="border-border/70 bg-muted/20 space-y-3 rounded-xl border p-4">
                <div className="space-y-1">
                  <Label
                    htmlFor={bundlePickerId}
                    className="text-foreground flex items-center gap-1.5 text-sm font-semibold"
                  >
                    <LayersIcon className="text-primary size-4" />
                    Componentes do Pacote
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Adicione produtos simples da loja com seus respectivos
                    multiplicadores.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    id={bundlePickerId}
                    aria-label="Selecionar componente"
                    value={selectedComponentId}
                    onChange={(e) => setSelectedComponentId(e.target.value)}
                    className="border-input bg-background text-foreground focus-visible:ring-ring/50 flex h-9 flex-1 rounded-lg border px-3 py-1 text-sm shadow-xs outline-hidden transition-colors focus-visible:ring-3"
                  >
                    <option value="">Selecione um produto simples...</option>
                    {availableSimpleProducts.map((p) => {
                      const available = getAvailableStock(p) ?? 0;
                      const typeLabel =
                        p.type === 'rent'
                          ? 'Aluguel'
                          : p.type === 'sale'
                            ? 'Venda'
                            : 'Serviço';
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({typeLabel} • {available} disp.)
                        </option>
                      );
                    })}
                  </select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddComponent}
                    disabled={!selectedComponentId}
                    className="shrink-0 cursor-pointer"
                  >
                    <PlusIcon className="mr-1.5 size-4" />
                    Adicionar Componente
                  </Button>
                </div>

                {bundleErrors.items && (
                  <p className="text-destructive text-xs font-medium">
                    {bundleErrors.items}
                  </p>
                )}

                {/* Added Components List */}
                <div className="mt-3 space-y-2">
                  {bundleItems.length === 0 ? (
                    <div className="text-muted-foreground border-border/70 rounded-lg border border-dashed p-4 text-center text-xs">
                      Nenhum componente adicionado ainda. Selecione um produto
                      acima para compor o pacote.
                    </div>
                  ) : (
                    bundleItems.map((item) => (
                      <div
                        key={item.productId}
                        data-testid={`bundle-item-${item.productId}`}
                        className="bg-background border-border/80 flex items-center justify-between gap-3 rounded-lg border p-2.5 shadow-xs"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground truncate text-sm font-medium">
                              {item.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="px-1.5 py-0 text-[10px] uppercase"
                            >
                              {item.type === 'rent' ? 'Aluguel' : 'Venda'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Estoque disponível: {item.availableStock} un
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground text-xs font-medium">
                              Qtd:
                            </span>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              aria-label={`Quantidade de ${item.name}`}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateMultiplier(
                                  item.productId,
                                  e.target.value
                                )
                              }
                              className="h-8 w-16 text-center text-xs"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              handleRemoveComponent(item.productId)
                            }
                            aria-label={`Remover ${item.name}`}
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottleneck Availability Preview Card */}
                {bottleneckInfo && (
                  <div
                    data-testid="bundle-bottleneck-preview"
                    className="bg-primary/5 border-primary/20 mt-3 space-y-1.5 rounded-xl border p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium">
                        Disponibilidade Estimada do Pacote:
                      </span>
                      <span className="text-foreground text-base font-bold">
                        {bottleneckInfo.availableStock}{' '}
                        {bottleneckInfo.availableStock === 1
                          ? 'unidade'
                          : 'unidades'}
                      </span>
                    </div>

                    {bottleneckInfo.bottlenecks.length > 0 && (
                      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <AlertTriangleIcon className="size-3.5 shrink-0 text-amber-500" />
                        <span>
                          Gargalo de estoque:{' '}
                          <strong className="text-foreground font-semibold">
                            {bottleneckInfo.bottlenecks
                              .map((b) => b.name)
                              .join(', ')}
                          </strong>{' '}
                          (limita em {bottleneckInfo.availableStock}{' '}
                          {bottleneckInfo.availableStock === 1
                            ? 'pacote'
                            : 'pacotes'}
                          )
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6 pt-2">
                <DialogClose
                  render={
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  }
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  )}
                  {isEditMode ? 'Salvar Alterações' : 'Criar Pacote'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProductDialog;
