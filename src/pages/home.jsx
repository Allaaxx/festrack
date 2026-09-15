import { Navigate } from 'react-router';

import AddTransactionButton from '@/components/add-transaction-button';
import Balance from '@/components/balance';
import DateSelection from '@/components/date-selection';
import TransactionsTable from '@/components/transactions-table';
import { TransactionsTypeChart } from '@/components/transactions-type-chart';
import { useAuthContext } from '@/contexts/auth';

const HomePage = () => {
  const { user, isInitializing } = useAuthContext();
  if (isInitializing) return null;
  if (!user) {
    return <Navigate to="/signin" />;
  }
  return (
    <>
      <div className="space-y-4 p-4 py-2 sm:space-y-6 sm:p-8 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Financeiro</h2>
            <p className="text-muted-foreground text-sm">
              Acompanhe suas entradas, saídas e investimentos.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <DateSelection />
            <AddTransactionButton />
          </div>
        </div>
        <div className="grid grid-cols-1 grid-rows-1 gap-8 sm:grid-cols-[2fr_1fr]">
          <Balance />
          <TransactionsTypeChart />
        </div>
        <TransactionsTable />
      </div>
    </>
  );
};

export default HomePage;
