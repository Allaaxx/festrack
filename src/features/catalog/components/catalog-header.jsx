import { cn } from '@/lib/utils';

/**
 * Hero header banner for the catalog management cockpit.
 * Adopts the primary accent visual hierarchy from dashboard-shell-04.
 */
const CatalogHeader = ({
  title = 'Catálogo',
  description = 'Gerencie produtos, pacotes virtuais e estoque da loja',
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-primary text-primary-foreground relative overflow-hidden rounded-2xl px-6 py-8 shadow-sm md:px-8 md:py-10',
        className
      )}
    >
      {/* Decorative ambient background accents */}
      <div
        aria-hidden="true"
        className="bg-primary-foreground/10 pointer-events-none absolute -top-12 -right-12 size-64 rounded-full blur-2xl"
      />
      <div
        aria-hidden="true"
        className="bg-primary-foreground/5 pointer-events-none absolute right-16 -bottom-16 size-48 rounded-full blur-xl"
      />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="text-primary-foreground/85 text-sm md:text-base">
            {description}
          </p>
        </div>
        {children && (
          <div className="flex items-center gap-2.5">{children}</div>
        )}
      </div>
    </div>
  );
};

export default CatalogHeader;
