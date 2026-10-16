import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';

import { LogoIcon } from '@/assets/images';
import SignupForm from '@/components/auth/signup-form';
import AuthLoading from '@/components/shared/auth-loading';
import { useAuthContext } from '@/contexts/auth';
import { useSignUpForm } from '@/forms/hooks/auth';
import { getRedirectDestination } from '@/helpers/url';

const SignUpPage = () => {
  const { user, signup, signInWithGoogle, isInitializing } = useAuthContext();
  const { form } = useSignUpForm();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const location = useLocation();
  const redirectTo = getRedirectDestination(location.state?.from);

  const handleSubmit = async (data) => {
    try {
      await signup(data);
    } catch (error) {
      const message = error?.message || 'Erro ao criar conta.';
      if (
        message.toLowerCase().includes('email') ||
        error?.code === 'USER_ALREADY_EXISTS'
      ) {
        form.setError('email', {
          message: 'Este e-mail já está em uso.',
        });
      } else {
        form.setError('root', {
          message,
        });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle({ callbackURL: redirectTo });
    } catch (error) {
      form.setError('root', {
        message:
          error?.message ||
          'Erro ao criar conta com Google. Tente novamente mais tarde.',
      });
      setIsGoogleLoading(false);
    }
  };

  if (isInitializing) {
    return <AuthLoading />;
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
              <LogoIcon className="size-4" />
            </div>
            <span className="text-lg font-semibold">Festrack</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <SignupForm
              form={form}
              onSubmit={handleSubmit}
              isGoogleLoading={isGoogleLoading}
              onGoogleSignIn={handleGoogleSignIn}
            />
          </div>
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

export default SignUpPage;
