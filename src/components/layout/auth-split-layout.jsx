import { Link } from 'react-router';

import { LogoIcon } from '@/assets/images';
import { cn } from '@/lib/utils';

/**
 * Split layout shell for authentication pages (sign-in, sign-up),
 * featuring brand logo navigation on the left column and theme-adaptive
 * hero cover image on the right column.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Form content rendered inside the constrained column.
 * @param {string} [props.maxWidth='max-w-sm'] - Tailwind max-width class constraint.
 */
const AuthSplitLayout = ({ children, maxWidth = 'max-w-sm' }) => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <div className="text-primary flex h-6 w-6 items-center justify-center rounded-md">
              <LogoIcon className="size-4" />
            </div>
            <span className="text-lg font-semibold">Festrack</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className={cn('w-full', maxWidth)}>{children}</div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/auth-cover-white.jpg"
          alt="Festrack"
          className="absolute inset-0 h-full w-full object-cover dark:hidden"
        />
        <img
          src="/auth-cover-black.jpg"
          alt="Festrack"
          className="absolute inset-0 hidden h-full w-full object-cover dark:block"
        />
      </div>
    </div>
  );
};

export default AuthSplitLayout;
