import { AlertCircleIcon, PlusIcon, ReceiptText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AddTransactionButton,
  transactionColumns,
  useGetTransactions,
} from '@/features/transactions';

/**
 * Tabela de transações dedicada para a visualização detalhada de um evento.
 *
 * @param {{
 *   eventId: string,
 *   transactions?: Array<any>,
 *   isLoading?: boolean,
 *   isError?: boolean,
 *   refetch?: () => void,
 * }} props
 */
const EventTransactionsTable = ({
  eventId,
  transactions: propTransactions,
  isLoading: propIsLoading,
  isError: propIsError,
  refetch: propRefetch,
}) => {
  const query = useGetTransactions({ eventId });
  const transactions = propTransactions ?? query.data ?? [];
  const isLoading = propIsLoading ?? query.isLoading;
  const isError = propIsError ?? query.isError;
  const refetch = propRefetch ?? query.refetch;

  if (isLoading) {
    return (
      <section className="space-y-4" data-testid="event-transactions-section">
        <h2 className="text-2xl font-bold">Transações</h2>
        <div
          data-testid="event-transactions-skeleton"
          className="rounded-md border"
        >
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4" data-testid="event-transactions-section">
        <h2 className="text-2xl font-bold">Transações</h2>
        <div
          data-testid="event-transactions-error"
          className="flex flex-col items-center justify-center gap-4 rounded-md border py-16 text-center"
        >
          <AlertCircleIcon className="text-muted-foreground size-10" />
          <div className="space-y-1">
            <p className="font-medium">
              Não foi possível carregar as transações.
            </p>
            <p className="text-muted-foreground text-sm">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch?.()}>
            Tentar novamente
          </Button>
        </div>
      </section>
    );
  }

  if (!transactions.length) {
    return (
      <section className="space-y-4" data-testid="event-transactions-section">
        <h2 className="text-2xl font-bold">Transações</h2>
        <div
          data-testid="event-transactions-empty"
          className="flex flex-col items-center justify-center gap-4 rounded-md border py-16 text-center"
        >
          <ReceiptText className="text-muted-foreground size-10" />
          <div className="space-y-1">
            <p className="font-medium">Nenhuma transação encontrada</p>
            <p className="text-muted-foreground text-sm">
              Nenhuma transação registrada para este evento.
            </p>
          </div>
          <AddTransactionButton
            initialEventId={eventId}
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                Adicionar transação
              </Button>
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" data-testid="event-transactions-section">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transações</h2>
        <AddTransactionButton
          initialEventId={eventId}
          trigger={
            <Button size="sm">
              <PlusIcon className="size-4" />
              Adicionar transação
            </Button>
          }
        />
      </div>

      <ScrollArea className="h-85 rounded-md border">
        <DataTable columns={transactionColumns} data={transactions} />
      </ScrollArea>
    </section>
  );
};

export default EventTransactionsTable;
