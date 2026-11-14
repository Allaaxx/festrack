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
                'group h-auto cursor-pointer p-0 font-normal hover:bg-transparent',
                className
              )}
            >
              <Badge
                variant={isOutOfStock ? 'destructive' : 'secondary'}
                className="group-hover:ring-primary/20 gap-1.5 font-medium transition-all group-hover:ring-2"
              >
                <BoxesIcon className="size-3.5 shrink-0" />
                <span>{availableStock} un</span>
                <InfoIcon className="text-muted-foreground ml-0.5 size-3 opacity-70 group-hover:opacity-100" />
              </Badge>
            </Button>
          )
        }
      />
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-84 gap-3 p-4 text-left shadow-lg sm:w-96"
      >
        <PopoverHeader className="gap-1 border-b pb-2.5">
          <div className="text-primary flex items-center gap-1.5">
            <PackageOpenIcon className="size-4 shrink-0" />
            <PopoverTitle className="text-foreground text-sm font-semibold">
              Composição & Gargalo do Pacote
            </PopoverTitle>
          </div>
          <PopoverDescription className="text-muted-foreground text-xs leading-relaxed">
            A disponibilidade máxima deste combo é calculada pelo componente
            mais restritivo (gargalo limitador).
          </PopoverDescription>
        </PopoverHeader>

        {/* High-level status bar */}
        <div
          className={cn(
            'flex items-center justify-between rounded-lg p-2.5 text-xs font-medium',
            isOutOfStock
              ? 'bg-destructive/10 text-destructive border-destructive/20 border'
              : 'bg-muted/60 text-foreground border-border/50 border'
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
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {components.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">
              Nenhum componente configurado neste pacote.
            </p>
          ) : (
            components.map((comp) => {
              const isBottleneck = comp.isBottleneck;

              return (
                <div
                  key={comp.id}
                  className={cn(
                    'space-y-1.5 rounded-lg border p-2.5 text-xs transition-colors',
                    isBottleneck
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-border/60 bg-card/60'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-foreground leading-tight font-semibold">
                      {comp.name}
                    </span>
                    {isBottleneck && (
                      <Badge
                        variant="destructive"
                        className="h-4.5 shrink-0 gap-1 px-1.5 text-[10px] font-medium"
                      >
                        <AlertTriangleIcon className="size-2.5 shrink-0" />
                        Gargalo Limitador
                      </Badge>
                    )}
                  </div>

                  <div className="text-muted-foreground flex flex-col gap-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span>Proporção:</span>
                      <span className="text-foreground font-medium">
                        {comp.multiplier} un por pacote
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estoque físico disponível:</span>
                      <span className="text-foreground font-medium">
                        {comp.availableStock} un ({comp.onHand} total,{' '}
                        {comp.reserved} res.)
                      </span>
                    </div>
                    <div className="border-border/40 mt-0.5 flex justify-between border-t pt-1 font-medium">
                      <span className={isBottleneck ? 'text-destructive' : ''}>
                        Permite montar:
                      </span>
                      <span
                        className={cn(
                          'font-semibold',
                          isBottleneck ? 'text-destructive' : 'text-foreground'
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
