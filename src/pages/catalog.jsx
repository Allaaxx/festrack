import {
  CatalogMetrics,
  CatalogOperationalGrid,
  CatalogTable,
  StockMovementsChart,
  useGetCatalogMetrics,
  useGetProducts,
  useGetStockMovements,
} from '@/features/catalog';

/**
 * Catalog cockpit page component.
 * Mounted at `/catalog` inside `DashboardLayout`.
 */
const CatalogPage = () => {
  const {
    data: products,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useGetProducts();
  const { data: metrics, isLoading: isMetricsLoading } = useGetCatalogMetrics();
  const { data: movementsData, isLoading: isMovementsLoading } =
    useGetStockMovements();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-1 md:gap-6 md:py-4">
        <CatalogMetrics
          products={products}
          metrics={metrics}
          isLoading={isMetricsLoading || isProductsLoading}
        />
        <div className="px-4">
          <StockMovementsChart
            data={movementsData?.series}
            movements={movementsData?.movements}
            products={products}
            isLoading={isMovementsLoading || isProductsLoading}
          />
        </div>
        <CatalogOperationalGrid
          products={products}
          movements={movementsData?.movements}
          isLoading={isProductsLoading || isMovementsLoading}
        />
        <div className="px-4">
          <CatalogTable
            products={products}
            movements={movementsData?.movements}
            isLoading={isProductsLoading}
            isError={isProductsError}
            refetch={refetchProducts}
          />
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
