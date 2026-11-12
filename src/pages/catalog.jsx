import {
  CatalogHeader,
  CatalogMetrics,
  CatalogTable,
  StockMovementsChart,
  useGetCatalogMetrics,
  useGetStockMovements,
} from '@/features/catalog';

/**
 * Catalog cockpit page component.
 * Mounted at `/catalog` inside `DashboardLayout`.
 */
const CatalogPage = () => {
  const { data: metrics, isLoading: isMetricsLoading } = useGetCatalogMetrics();
  const { data: movementsData, isLoading: isMovementsLoading } =
    useGetStockMovements();

  return (
    <div className="@container/main flex flex-1 flex-col gap-6">
      <CatalogHeader />
      <CatalogMetrics metrics={metrics} isLoading={isMetricsLoading} />
      <StockMovementsChart
        data={movementsData?.series}
        isLoading={isMovementsLoading}
      />
      <CatalogTable />
    </div>
  );
};

export default CatalogPage;
