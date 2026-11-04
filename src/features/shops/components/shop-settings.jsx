import { Separator } from '@/components/ui/separator';

import ShopDangerZoneCard from './shop-danger-zone-card';
import ShopGeneralForm from './shop-general-form';
import ShopMembersSection from './shop-members-section';

const ShopSettings = () => {
  return (
    <section className="py-3">
      <div className="mx-auto max-w-7xl">
        <ShopGeneralForm />
        <Separator className="my-10" />
        <ShopMembersSection />
        <Separator className="my-10" />
        <ShopDangerZoneCard />
      </div>
    </section>
  );
};

export default ShopSettings;
