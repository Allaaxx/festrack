import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';

import { LoginForm } from '@/components/auth';
import { AuthSplitLayout } from '@/components/layout';
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
    <AuthSplitLayout maxWidth="max-w-sm">
      <LoginForm
        form={form}
        onSubmit={handleSubmit}
        isGoogleLoading={isGoogleLoading}
        onGoogleSignIn={handleGoogleSignIn}
        redirectState={location.state}
      />
    </AuthSplitLayout>
  );
};

export default SignInPage;
