import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/helpers/currency';

const BalanceItem = ({ label, icon, amount }) => {
  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        <div className="flex items-center gap-2">
          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
            {icon}
          </div>
          <p className="text-muted-foreground text-sm">{label}</p>
        </div>
        <h3 className="text-2xl font-semibold">{formatCurrency(amount)}</h3>
      </CardContent>
    </Card>
  );
};

export default BalanceItem;
