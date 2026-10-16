import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';

import { LogoIcon } from '@/assets/images';
import LoginForm from '@/components/auth/login-form';
import AuthLoading from '@/components/shared/auth-loading';
import { useAuthContext } from '@/contexts/auth';
import { useSignInForm } from '@/forms/hooks/auth';
import { getOAuthErrorMessage } from '@/helpers/auth';
import { getRedirectDestination } from '@/helpers/url';

const SignInPage = () => {
  const { user, signin, signInWithGoogle, isInitializing } = useAuthContext();
  const { form } = useSignInForm();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const location = useLocation();
  const redirectTo = getRedirectDestination(location.state?.from);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorCode = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorCode || errorDescription) {
      const message = getOAuthErrorMessage(errorCode, errorDescription);
      if (message) {
        form.setError('root', { message });
      }
    }
  }, [location.search, form]);

  const handleSubmit = async (data) => {
    try {
      await signin(data);
    } catch (error) {
      form.setError('root', {
        message:
          error?.message ||
          'E-mail ou senha incorretos. Verifique suas credenciais.',
      });
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
          'Erro ao entrar com Google. Tente novamente mais tarde.',
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
          <div className="w-full max-w-sm">
            <LoginForm
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

export default SignInPage;
