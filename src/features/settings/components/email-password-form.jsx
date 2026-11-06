import { Separator } from '@/components/ui/separator';

import EmailForm from './email-form';
import PasswordForm from './password-form';

const EmailPasswordForm = () => {
  return (
    <div className="space-y-10">
      <EmailForm />
      <Separator />
      <PasswordForm />
    </div>
  );
};

export default EmailPasswordForm;
