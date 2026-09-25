import { Separator } from '@/components/ui/separator';

import ConnectedAccountsCard from './connected-accounts-card';
import DangerZoneCard from './danger-zone-card';
import EmailPasswordForm from './email-password-form';

const AccountSettings = () => {
  return (
    <section className="py-3">
      <div className="mx-auto max-w-7xl">
        <EmailPasswordForm />
        <Separator className="my-10" />
        <ConnectedAccountsCard />
        <Separator className="my-10" />
        <DangerZoneCard />
      </div>
    </section>
  );
};

export default AccountSettings;
