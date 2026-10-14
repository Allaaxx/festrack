import { AlertCircleIcon, ReceiptText } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetTransactions } from '@/features/transactions/api/hooks';
import AddTransactionButton from '@/features/transactions/components/add-transaction-button';
import transactionColumns from '@/features/transactions/components/transaction-columns';

const TransactionsTable = () => {
  const [searchParams] = useSearchParams();

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const {
    data: transactions,
    isLoading,
    isError,
    refetch,
  } = useGetTransactions({ from, to });

  if (isLoading) {
    return (
      <section>
        <h2 className="mb-4 text-2xl font-bold">Transações</h2>
        <div className="rounded-md border">
          <div className="space-y-2 p-4">
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
      <section>
        <h2 className="mb-4 text-2xl font-bold">Transações</h2>
        <div className="flex flex-col items-center justify-center gap-4 rounded-md border py-16 text-center">
          <AlertCircleIcon className="text-muted-foreground size-10" />
          <div className="space-y-1">
            <p className="font-medium">
              Não foi possível carregar as transações.
            </p>
            <p className="text-muted-foreground text-sm">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </section>
    );
  }

  if (!transactions?.length) {
    return (
      <section>
        <h2 className="mb-4 text-2xl font-bold">Transações</h2>
        <div className="flex flex-col items-center justify-center gap-4 rounded-md border py-16 text-center">
          <ReceiptText className="text-muted-foreground size-10" />
          <div className="space-y-1">
            <p className="font-medium">Nenhuma transação encontrada</p>
            <p className="text-muted-foreground text-sm">
              Nenhuma transação registrada no período selecionado.
            </p>
          </div>
          <AddTransactionButton />
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Transações</h2>

      <ScrollArea className="h-85 rounded-md border">
        <DataTable columns={transactionColumns} data={transactions} />
      </ScrollArea>
    </section>
  );
};

export default TransactionsTable;
