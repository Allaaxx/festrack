import { Separator } from '@/components/ui/separator';

import DangerZoneCard from './danger-zone-card';
import EmailPasswordForm from './email-password-form';
import PersonalInfoForm from './personal-info-form';

const AccountSettings = () => {
  return (
    <section className="py-3">
      <div className="mx-auto max-w-7xl">
        <PersonalInfoForm />
        <Separator className="my-10" />
        <EmailPasswordForm />
        <Separator className="my-10" />
        <DangerZoneCard />
      </div>
    </section>
  );
};

export default AccountSettings;
