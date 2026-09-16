import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PasswordInput = forwardRef(
  ({ placeholder = 'Digite sua senha', ...props }, ref) => {
    const [passwordIsVisible, setPasswordIsVisible] = useState(false);
    return (
      <div className="relative">
        <Input
          type={passwordIsVisible ? 'text' : 'password'}
          placeholder={placeholder}
          ref={ref}
          {...props}
        />
        <Button
          variant="ghost"
          className="text-muted-foreground absolute top-0 right-0 bottom-0 my-auto h-8 w-8"
          onClick={() => setPasswordIsVisible((prev) => !prev)}
          type="button"
        >
          {passwordIsVisible ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
