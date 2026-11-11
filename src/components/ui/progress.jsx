'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';

import { cn } from '@/lib/utils';

function Progress({ className, value, max = 100, children, ...props }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-muted',
        className
      )}
      {...props}
    >
      {children || (
        <ProgressPrimitive.Track className="h-full w-full">
          <ProgressPrimitive.Indicator className="h-full bg-primary transition-all duration-300" />
        </ProgressPrimitive.Track>
      )}
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({ className, ...props }) {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn('h-full w-full', className)}
      {...props}
    />
  );
}

function ProgressIndicator({ className, ...props }) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn('h-full bg-primary transition-all duration-300', className)}
      {...props}
    />
  );
}

export { Progress, ProgressIndicator, ProgressTrack };
