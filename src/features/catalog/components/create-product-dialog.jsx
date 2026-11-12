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
} from '@/features/catalog/api/products';
import { calculateBundleBottleneck } from '@/features/catalog/helpers/bundle';

/**
 * Modal dialog for unified creation of simple products and virtual bundles.
 * Implements ticket #114 and follows Base UI element composition standards without `asChild`.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.trigger]
 * @param {boolean} [props.open]
 * @param {(open: boolean) => void} [props.onOpenChange]
 * @param {(product: Object) => void} [props.onSuccess]
 */
const CreateProductDialog = ({
  trigger,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? open : internalOpen;

  const [activeTab, setActiveTab] = useState('simple');

  // Simple Product Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('rent');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [simpleErrors, setSimpleErrors] = useState({});

  // Virtual Bundle Form State
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [bundlePrice, setBundlePrice] = useState('');
  const [bundleItems, setBundleItems] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [bundleErrors, setBundleErrors] = useState({});

  const simpleNameId = useId();
  const simpleDescId = useId();
  const simpleTypeId = useId();
  const simplePriceId = useId();
  const simpleStockId = useId();

  const bundleNameId = useId();
  const bundleDescId = useId();
  const bundlePriceId = useId();
  const bundlePickerId = useId();

  const { data: allProducts = [] } = useGetProducts();
  const createProductMutation = useCreateProduct();

  const availableSimpleProducts = useMemo(
    () => allProducts.filter((p) => !p.is_bundle),
    [allProducts]
  );

  const resetForm = () => {
    setActiveTab('simple');
    setName('');
    setDescription('');
    setType('rent');
    setPrice('');
    setQuantity('0');
    setSimpleErrors({});

    setBundleName('');
    setBundleDescription('');
    setBundlePrice('');
    setBundleItems([]);
    setSelectedComponentId('');
    setBundleErrors({});
  };

  const handleOpenChange = (nextOpen) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      resetForm();
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
      const available = Math.max(0, onHand - reserved);

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
      payload.initial_quantity = payload.quantity;
    }

    try {
      const created = await createProductMutation.mutateAsync(payload);
      handleOpenChange(false);
      onSuccess?.(created);
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
      errors.items = 'Adicione pelo menos um componente ao pacote virtual.';
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
      const created = await createProductMutation.mutateAsync(payload);
      handleOpenChange(false);
      onSuccess?.(created);
    } catch {
      // Error handled by hook toast
    }
  };

  const defaultTrigger = (
    <Button
      type="button"
      variant="secondary"
      className="bg-background text-foreground hover:bg-background/90 shadow-sm cursor-pointer"
    >
      <PlusIcon className="size-4 mr-1.5" />
      Novo Produto
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger || defaultTrigger} />
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <PackageIcon className="size-5 text-primary" />
            Novo Produto
          </DialogTitle>
          <DialogDescription>
            Cadastre um produto simples ou componha um pacote virtual dinâmico
            para o catálogo da sua loja.
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
              Pacote Virtual
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={simpleTypeId}>Classificação</Label>
                  <select
                    id={simpleTypeId}
                    aria-label="Classificação"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="border-input bg-background text-foreground flex h-9 w-full rounded-lg border px-3 py-1 text-sm shadow-xs transition-colors outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50"
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
                  disabled={createProductMutation.isPending}
                  className="cursor-pointer"
                >
                  {createProductMutation.isPending && (
                    <Loader2Icon className="size-4 mr-2 animate-spin" />
                  )}
                  Criar Produto
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Virtual Bundle Tab */}
          <TabsContent value="bundle" className="mt-4">
            <form onSubmit={handleSubmitBundle} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={bundleNameId}>Nome do Pacote</Label>
                <Input
                  id={bundleNameId}
                  aria-label="Nome do Pacote"
                  placeholder="Ex: Combo Provençal Rústico Luxo"
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
                  placeholder="Detalhes dos itens combinados no combo..."
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
              <div className="border-border/70 rounded-xl border p-4 space-y-3 bg-muted/20">
                <div className="space-y-1">
                  <Label
                    htmlFor={bundlePickerId}
                    className="text-sm font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <LayersIcon className="size-4 text-primary" />
                    Componentes do Pacote Virtual
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Adicione produtos simples da loja com seus respectivos multiplicadores.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id={bundlePickerId}
                    aria-label="Selecionar componente"
                    value={selectedComponentId}
                    onChange={(e) => setSelectedComponentId(e.target.value)}
                    className="border-input bg-background text-foreground flex h-9 flex-1 rounded-lg border px-3 py-1 text-sm shadow-xs transition-colors outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Selecione um produto simples...</option>
                    {availableSimpleProducts.map((p) => {
                      const onHand = Number(
                        p?.stock?.quantity ?? p?.quantity ?? 0
                      );
                      const reserved = Number(
                        p?.stock?.reserved ?? p?.reserved ?? 0
                      );
                      const available = Math.max(0, onHand - reserved);
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
                    className="cursor-pointer shrink-0"
                  >
                    <PlusIcon className="size-4 mr-1.5" />
                    Adicionar Componente
                  </Button>
                </div>

                {bundleErrors.items && (
                  <p className="text-destructive text-xs font-medium">
                    {bundleErrors.items}
                  </p>
                )}

                {/* Added Components List */}
                <div className="space-y-2 mt-3">
                  {bundleItems.length === 0 ? (
                    <div className="text-muted-foreground border-border/70 rounded-lg border border-dashed p-4 text-center text-xs">
                      Nenhum componente adicionado ainda. Selecione um produto acima
                      para compor o pacote.
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
                            <span className="text-sm font-medium text-foreground truncate">
                              {item.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 uppercase"
                            >
                              {item.type === 'rent' ? 'Aluguel' : 'Venda'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Estoque disponível: {item.availableStock} un
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
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
                            onClick={() => handleRemoveComponent(item.productId)}
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
                    className="bg-primary/5 border-primary/20 rounded-xl border p-3.5 space-y-1.5 mt-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Disponibilidade Estimada do Pacote:
                      </span>
                      <span className="text-base font-bold text-foreground">
                        {bottleneckInfo.availableStock}{' '}
                        {bottleneckInfo.availableStock === 1
                          ? 'unidade'
                          : 'unidades'}
                      </span>
                    </div>

                    {bottleneckInfo.bottlenecks.length > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <AlertTriangleIcon className="size-3.5 text-amber-500 shrink-0" />
                        <span>
                          Gargalo de estoque:{' '}
                          <strong className="font-semibold text-foreground">
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
                  disabled={createProductMutation.isPending}
                  className="cursor-pointer"
                >
                  {createProductMutation.isPending && (
                    <Loader2Icon className="size-4 mr-2 animate-spin" />
                  )}
                  Criar Pacote
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