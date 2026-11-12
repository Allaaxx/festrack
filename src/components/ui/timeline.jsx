import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

function Timeline({ className, render, ...props }) {
  return useRender({
    defaultTagName: 'ol',
    props: mergeProps(
      {
        'data-slot': 'timeline',
        className: cn('relative flex flex-col', className),
      },
      props
    ),
    render,
    state: {
      slot: 'timeline',
    },
  });
}

function TimelineItem({ className, render, ...props }) {
  return useRender({
    defaultTagName: 'li',
    props: mergeProps(
      {
        'data-slot': 'timeline-item',
        className: cn(
          'group/timeline-item relative flex gap-4 pb-8 last:pb-0',
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: 'timeline-item',
    },
  });
}

const timelineConnectorVariants = cva(
  'absolute top-6 bottom-0 left-3 w-0.5 -translate-x-1/2 group-last/timeline-item:hidden transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-border',
        primary: 'bg-primary',
        success: 'bg-emerald-500 dark:bg-emerald-600',
        destructive: 'bg-destructive',
        warning: 'bg-amber-500 dark:bg-amber-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function TimelineConnector({
  className,
  variant = 'default',
  render,
  ...props
}) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps(
      {
        'data-slot': 'timeline-connector',
        'aria-hidden': 'true',
        className: cn(timelineConnectorVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: 'timeline-connector',
    },
  });
}

const timelineDotVariants = cva(
  'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium shadow-xs transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
        primary: 'border-primary bg-primary text-primary-foreground',
        success:
          'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground',
        warning:
          'border-amber-500 bg-amber-500 text-white dark:border-amber-600 dark:bg-amber-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function TimelineDot({
  className,
  variant = 'default',
  children,
  render,
  ...props
}) {
  const content = children ?? (
    <span className="size-2 rounded-full bg-current" />
  );

  return useRender({
    defaultTagName: 'div',
    props: mergeProps(
      {
        'data-slot': 'timeline-dot',
        'data-variant': variant,
        className: cn(timelineDotVariants({ variant }), className),
        children: content,
      },
      props
    ),
    render,
    state: {
      slot: 'timeline-dot',
      variant,
    },
  });
}

function TimelineContent({ className, render, ...props }) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps(
      {
        'data-slot': 'timeline-content',
        className: cn('flex flex-1 flex-col gap-1 pt-0.5', className),
      },
      props
    ),
    render,
    state: {
      slot: 'timeline-content',
    },
  });
}

function TimelineTitle({ className, render, ...props }) {
  return useRender({
    defaultTagName: 'h3',
    props: mergeProps(
      {
        'data-slot': 'timeline-title',
        className: cn(
          'text-foreground text-sm font-semibold leading-none tracking-tight',
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: 'timeline-title',
    },
  });
}

function TimelineDescription({ className, render, ...props }) {
  return useRender({
    defaultTagName: 'p',
    props: mergeProps(
      {
        'data-slot': 'timeline-description',
        className: cn(
          'text-muted-foreground text-xs leading-normal',
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: 'timeline-description',
    },
  });
}

function TimelineTime({ className, render, ...props }) {
  return useRender({
    defaultTagName: 'time',
    props: mergeProps(
      {
        'data-slot': 'timeline-time',
        className: cn('text-muted-foreground text-xs font-normal', className),
      },
      props
    ),
    render,
    state: {
      slot: 'timeline-time',
    },
  });
}

export {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  timelineDotVariants,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
};
