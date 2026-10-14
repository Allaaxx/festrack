import { Skeleton } from '@/components/ui/skeleton';

const EventDetailSkeleton = () => {
  return (
    <div
      data-testid="event-detail-skeleton"
      className="space-y-6"
    >
      <div className="space-y-4">
        <div>
          <Skeleton className="h-8 w-44 rounded-md" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-64 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-4 w-80 rounded-md" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-9 w-36 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
};

export default EventDetailSkeleton;
