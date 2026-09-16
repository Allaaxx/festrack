import { cva } from 'class-variance-authority';
import { CircleIcon } from 'lucide-react';

const badgeVariants = cva(
  'bg-muted flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold',
  {
    variants: {
      variant: {
        earning: 'text-primary-green fill-primary-green',
        expense: 'text-primary-red fill-primary-red',
        investment: 'text-primary-blue fill-primary-blue',
      },
    },
    defaultVariants: {
      variant: 'earning',
    },
  }
);

const TransactionTypeBadge = ({ variant }) => {
  return (
    <div className={badgeVariants({ variant })}>
      <CircleIcon size={10} className="fill-inherit" />
      {variant === 'earning'
        ? 'Ganho'
        : variant === 'expense'
          ? 'Gasto'
          : 'Investimento'}
    </div>
  );
};

export default TransactionTypeBadge;
