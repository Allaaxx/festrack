import { Separator } from '@/components/ui/separator';

import PersonalInfoForm from './personal-info-form';
import SocialUrlsCard from './social-urls-card';

const ProfileSettings = () => {
  return (
    <section className="py-3">
      <div className="mx-auto max-w-7xl">
        <PersonalInfoForm />
        <Separator className="my-10" />
        <SocialUrlsCard />
      </div>
    </section>
  );
};

export default ProfileSettings;
