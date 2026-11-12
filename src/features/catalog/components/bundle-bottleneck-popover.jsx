import {
  AlertTriangleIcon,
  BoxesIcon,
  InfoIcon,
  PackageOpenIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { calculateBundleBottleneck } from '@/features/catalog/helpers/bundle';
import { cn } from '@/lib/utils';

/**
 * Popover component that displays the required component composition
 * and highlights the limiting bottleneck item(s) for virtual product bundles.
 *
 * @param {Object} props
 * @param {Object} props.bundle - Bundle product entity.
 * @param {Array<Object>} [props.allProducts] - Optional products directory for component resolution.
 * @param {React.ReactNode} [props.trigger] - Optional custom trigger element.
 * @param {string} [props.className] - Additional classes for styling the trigger badge.
 */
const BundleBottleneckPopover = ({
  bundle,
  allProducts = [],
  trigger,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const bottleneckData = useMemo(() => {
    return calculateBundleBottleneck(bundle, allProducts);
  }, [bundle, allProducts]);

  const { availableStock, components } = bottleneckData;
  const isOutOfStock = availableStock === 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          trigger ?? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Estoque do pacote ${bundle?.name ?? ''}`}
              className={cn(
                'group h-auto p-0 cursor-pointer hover:bg-transparent font-normal',
                className
              )}
            >
              <Badge
                variant={isOutOfStock ? 'destructive' : 'secondary'}
                className="gap-1.5 font-medium transition-all group-hover:ring-2 group-hover:ring-primary/20"
              >
                <BoxesIcon className="size-3.5 shrink-0" />
                <span>{availableStock} un</span>
                <InfoIcon className="size-3 text-muted-foreground ml-0.5 opacity-70 group-hover:opacity-100" />
              </Badge>
            </Button>
          )
        }
      />
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-84 sm:w-96 p-4 gap-3 text-left shadow-lg"
      >
        <PopoverHeader className="gap-1 border-b pb-2.5">
          <div className="flex items-center gap-1.5 text-primary">
            <PackageOpenIcon className="size-4 shrink-0" />
            <PopoverTitle className="text-sm font-semibold text-foreground">
              Composição & Gargalo do Pacote
            </PopoverTitle>
          </div>
          <PopoverDescription className="text-xs text-muted-foreground leading-relaxed">
            A disponibilidade máxima deste combo é calculada pelo componente
            mais restritivo (gargalo limitador).
          </PopoverDescription>
        </PopoverHeader>

        {/* High-level status bar */}
        <div
          className={cn(
            'flex items-center justify-between rounded-lg p-2.5 text-xs font-medium',
            isOutOfStock
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-muted/60 text-foreground border border-border/50'
          )}
        >
          <span>Disponibilidade Atual:</span>
          <span className="font-semibold">
            {availableStock === 1
              ? '1 pacote montável'
              : `${availableStock} pacotes montáveis`}
          </span>
        </div>

        {/* Components breakdown */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {components.length === 0 ? (
            <p className="text-muted-foreground text-xs text-center py-4">
              Nenhum componente configurado neste pacote virtual.
            </p>
          ) : (
            components.map((comp) => {
              const isBottleneck = comp.isBottleneck;

              return (
                <div
                  key={comp.id}
                  className={cn(
                    'rounded-lg border p-2.5 space-y-1.5 transition-colors text-xs',
                    isBottleneck
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-border/60 bg-card/60'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-foreground leading-tight">
                      {comp.name}
                    </span>
                    {isBottleneck && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] h-4.5 px-1.5 gap-1 shrink-0 font-medium"
                      >
                        <AlertTriangleIcon className="size-2.5 shrink-0" />
                        Gargalo Limitador
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 text-muted-foreground text-[11px]">
                    <div className="flex justify-between">
                      <span>Proporção:</span>
                      <span className="font-medium text-foreground">
                        {comp.multiplier} un por pacote
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estoque físico disponível:</span>
                      <span className="font-medium text-foreground">
                        {comp.availableStock} un ({comp.onHand} total,{' '}
                        {comp.reserved} res.)
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border/40 pt-1 mt-0.5 font-medium">
                      <span className={isBottleneck ? 'text-destructive' : ''}>
                        Permite montar:
                      </span>
                      <span
                        className={cn(
                          'font-semibold',
                          isBottleneck
                            ? 'text-destructive'
                            : 'text-foreground'
                        )}
                      >
                        {comp.maxBundles}{' '}
                        {comp.maxBundles === 1 ? 'pacote' : 'pacotes'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BundleBottleneckPopover;
