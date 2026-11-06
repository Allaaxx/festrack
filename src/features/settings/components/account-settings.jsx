import { Separator } from '@/components/ui/separator';

import ConnectedAccountsCard from './connected-accounts-card';
import DangerZoneCard from './danger-zone-card';
import EmailForm from './email-form';
import PasswordForm from './password-form';

const AccountSettings = () => {
  return (
    <section className="py-3">
      <div className="mx-auto max-w-7xl">
        <EmailForm />
        <Separator className="my-10" />
        <PasswordForm />
        <Separator className="my-10" />
        <ConnectedAccountsCard />

        <Separator className="my-10" />
        <DangerZoneCard />
      </div>
    </section>
  );
};

export default AccountSettings;
