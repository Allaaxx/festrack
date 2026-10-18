import {
  ChartAreaInteractive,
  SectionCards,
  TransactionsTable,
  useFinancePage,
} from '@/features/finances';

export default function FinancePage() {
  const financePage = useFinancePage();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-1 md:gap-6 md:py-4">
        <SectionCards
          balance={financePage.balance}
          isLoading={financePage.isLoading}
        />
        <div className="px-4">
          <ChartAreaInteractive
            transactions={financePage.transactions}
            from={financePage.params.from}
            to={financePage.params.to}
            activePreset={financePage.preset}
            onPresetChange={financePage.handlers.setPresetRange}
            onDateRangeChange={financePage.handlers.setDateRange}
            isLoading={financePage.isLoading}
          />
        </div>
        <div className="px-4">
          <TransactionsTable
            transactions={financePage.transactions}
            isLoading={financePage.isLoading}
            isError={financePage.isError}
            refetch={financePage.refetch}
            page={financePage.params.page}
            pageSize={financePage.params.pageSize}
            q={financePage.params.q}
            onPageChange={financePage.handlers.setPage}
            onPageSizeChange={financePage.handlers.setPageSize}
            onSearchChange={financePage.handlers.setSearchQuery}
          />
        </div>
      </div>
    </div>
  );
}
