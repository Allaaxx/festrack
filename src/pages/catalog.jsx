import { CatalogHeader } from '@/features/catalog';

/**
 * Catalog cockpit page component.
 * Mounted at `/catalog` inside `DashboardLayout`.
 */
const CatalogPage = () => {
  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <CatalogHeader />
    </div>
  );
};

export default CatalogPage;
