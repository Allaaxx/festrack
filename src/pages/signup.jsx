import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';

import { SignupForm } from '@/components/auth';
import { AuthSplitLayout } from '@/components/layout';
import AuthLoading from '@/components/shared/auth-loading';
import { useAuthContext } from '@/contexts/auth';
import { useSignUpForm } from '@/forms/hooks/auth';
import { getOAuthErrorMessage } from '@/helpers/auth';
import { getRedirectDestination } from '@/helpers/url';

const SignUpPage = () => {
  const { user, signup, signInWithGoogle, isInitializing } = useAuthContext();
  const { form } = useSignUpForm();
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
    <AuthSplitLayout maxWidth="max-w-md">
      <SignupForm
        form={form}
        onSubmit={handleSubmit}
        isGoogleLoading={isGoogleLoading}
        onGoogleSignIn={handleGoogleSignIn}
        redirectState={location.state}
      />
    </AuthSplitLayout>
  );
};

export default SignUpPage;
