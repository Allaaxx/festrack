import {
  ChartAreaInteractive,
  SectionCards,
  TransactionsTable,
} from '@/features/finances';

export default function FinancePage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-1 md:gap-6 md:py-4">
        <SectionCards />
        <div className="px-4">
          <ChartAreaInteractive />
        </div>
        <div className="px-4">
          <TransactionsTable />
        </div>
      </div>
    </div>
  );
}
