'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from '@/components/ui/timeline';
import { useGetRentals } from '@/features/catalog/api/rentals';
import RentalCheckinDialog from '@/features/catalog/components/rental-checkin-dialog';
import { cn } from '@/lib/utils';

const TAB_STAGES = [
  { value: 'pending_return', label: 'Retorno Pendente' },
  { value: 'active', label: 'Em Evento' },
  { value: 'reserved', label: 'Reservados' },
  { value: 'inspected', label: 'Inspecionados' },
];

function getStatusDotVariant(status) {
  switch (status) {
    case 'pending_return':
      return 'warning';
    case 'active':
      return 'primary';
    case 'reserved':
      return 'default';
    case 'inspected':
      return 'success';
    default:
      return 'default';
  }
}

function formatItemsSummary(items = []) {
  if (!items || items.length === 0) return 'Nenhum item alocado';
  return items.map((it) => `${it.quantity}x ${it.productName}`).join(', ');
}

/**
 * Logistics and rental lifecycle tracking card.
 * Features tabs across rental stages, on-time return rate progress bar,
 * and a vertical timeline with check-in trigger action.
 *
 * @param {object} props
 * @param {Array<object>} [props.rentals]
 * @param {number} [props.onTimeReturnRate]
 * @param {boolean} [props.isLoading]
 * @param {string} [props.className]
 */
export default function RentalCheckinCard({
  rentals: propRentals,
  onTimeReturnRate: propOnTimeRate,
  isLoading: propIsLoading,
  className,
}) {
  const { data: rentalsData, isLoading: queryLoading } = useGetRentals();
  const isLoading = propIsLoading ?? queryLoading;

  const [activeTab, setActiveTab] = useState('pending_return');
  const [selectedRental, setSelectedRental] = useState(null);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);

  const rentals = useMemo(() => {
    if (propRentals) return propRentals;
    if (Array.isArray(rentalsData)) return rentalsData;
    return rentalsData?.rentals || [];
  }, [propRentals, rentalsData]);

  const onTimeRate = useMemo(() => {
    if (typeof propOnTimeRate === 'number') return propOnTimeRate;
    if (typeof rentalsData?.onTimeReturnRate === 'number') {
      return rentalsData.onTimeReturnRate;
    }
    return 92;
  }, [propOnTimeRate, rentalsData]);

  const stageCounts = useMemo(() => {
    const counts = {
      pending_return: 0,
      active: 0,
      reserved: 0,
      inspected: 0,
    };
    rentals.forEach((r) => {
      if (counts[r.status] !== undefined) {
        counts[r.status] += 1;
      }
    });
    return counts;
  }, [rentals]);

  const handleOpenCheckin = (rental) => {
    setSelectedRental(rental);
    setIsCheckinOpen(true);
  };

  return (
    <Card
      className={cn('overflow-hidden', className)}
      data-testid="rental-checkin-card"
    >
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-semibold">
            Controle de Locações
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Acompanhe entregas, retiradas e devoluções para eventos
          </CardDescription>
        </div>

        <div className="flex flex-col gap-1.5 sm:w-64">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Taxa de Devoluções no Prazo
            </span>
            <span className="font-semibold text-foreground">{onTimeRate}%</span>
          </div>
          <Progress value={onTimeRate} className="h-2" />
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b px-6 pb-3">
          <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
            {TAB_STAGES.map((stage) => (
              <TabsTrigger
                key={stage.value}
                value={stage.value}
                className="gap-1.5 text-xs sm:text-sm"
              >
                {stage.label}
                {stageCounts[stage.value] > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[10px] font-medium"
                  >
                    {stageCounts[stage.value]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col gap-4 py-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            TAB_STAGES.map((stage) => {
              const stageRentals = rentals.filter(
                (r) => r.status === stage.value
              );

              return (
                <TabsContent
                  key={stage.value}
                  value={stage.value}
                  className="mt-0"
                >
                  {stageRentals.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma locação encontrada nesta etapa.
                    </div>
                  ) : (
                    <Timeline>
                      {stageRentals.map((rental) => (
                        <TimelineItem key={rental.id}>
                          <TimelineConnector />
                          <TimelineDot
                            variant={getStatusDotVariant(rental.status)}
                          />
                          <TimelineContent className="gap-1.5 pb-6">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <TimelineTitle className="text-sm font-semibold">
                                {rental.customerName} — {rental.eventName}
                              </TimelineTitle>
                              <TimelineTime className="text-xs text-muted-foreground">
                                {rental.scheduledDates}
                              </TimelineTime>
                            </div>
                            <TimelineDescription className="text-xs text-muted-foreground">
                              {formatItemsSummary(rental.items)}
                            </TimelineDescription>
                            {rental.status === 'pending_return' && (
                              <div className="pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenCheckin(rental)}
                                >
                                  Registrar Check-in
                                </Button>
                              </div>
                            )}
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  )}
                </TabsContent>
              );
            })
          )}
        </CardContent>
      </Tabs>

      <RentalCheckinDialog
        open={isCheckinOpen}
        onOpenChange={setIsCheckinOpen}
        rental={selectedRental}
      />
    </Card>
  );
}
