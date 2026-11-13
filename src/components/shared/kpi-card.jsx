import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Reusable KPI metric card with structured header, tabular value display,
 * directional trend badge, two-line footer, and accessible loading skeletons.
 *
 * @param {{
 *   testId?: string,
 *   title?: import('react').ReactNode,
 *   description?: import('react').ReactNode,
 *   value?: import('react').ReactNode,
 *   badgeText?: import('react').ReactNode,
 *   badgeIcon?: import('react').ReactNode,
 *   badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link',
 *   badgeClassName?: string,
 *   footerTitle?: import('react').ReactNode,
 *   footerIcon?: import('react').ReactNode,
 *   footerSubtitle?: import('react').ReactNode,
 *   isLoading?: boolean,
 *   className?: string,
 * }} props
 */
export function KpiCard({
  testId,
  title,
  description,
  value,
  badgeText,
  badgeIcon,
  badgeVariant = 'outline',
  badgeClassName,
  footerTitle,
  footerIcon,
  footerSubtitle,
  isLoading = false,
  className,
  ...props
}) {
  return (
    <Card
      data-testid={testId ?? props['data-testid']}
      className={cn('@container/card', className)}
      {...props}
    >
      <CardHeader className="flex flex-col sm:grid md:flex-row">
        <CardDescription>{title ?? description}</CardDescription>
        {isLoading ? (
          <Skeleton
            data-testid="kpi-skeleton"
            data-slot="skeleton"
            aria-hidden="true"
            className="h-8 w-32"
          />
        ) : (
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {value}
          </CardTitle>
        )}
        <CardAction>
          {isLoading ? (
            <Skeleton
              data-testid="kpi-skeleton"
              data-slot="skeleton"
              aria-hidden="true"
              className="h-5 w-14 rounded-full"
            />
          ) : (
            <Badge variant={badgeVariant} className={badgeClassName}>
              {badgeIcon}
              {badgeText}
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {footerTitle}
          {footerIcon}
        </div>
        <div className="text-muted-foreground">{footerSubtitle}</div>
      </CardFooter>
    </Card>
  );
}

export default KpiCard;
