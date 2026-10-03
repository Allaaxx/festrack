import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Link, Navigate } from 'react-router';

import GoogleIcon from '@/components/shared/google-icon';
import PasswordInput from '@/components/shared/password-input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/contexts/auth';
import { useSignInForm } from '@/forms/hooks/auth';

const SignInPage = () => {
  const { user, signin, signInWithGoogle, isInitializing } = useAuthContext();
  const { form } = useSignInForm();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
      await signInWithGoogle({ callbackURL: '/' });
    } catch (error) {
      form.setError('root', {
        message:
          error?.message ||
          'Erro ao entrar com Google. Tente novamente mais tarde.',
      });
      setIsGoogleLoading(false);
    }
  };

  if (isInitializing) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3">
      <Card className="w-2xs sm:w-full sm:max-w-lg">
        <CardHeader>
          <CardTitle>Entre na sua conta</CardTitle>
          <CardDescription>Insira seus dados abaixo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || form.formState.isSubmitting}
          >
            {isGoogleLoading ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuar com Google
          </Button>

          <div className="relative flex items-center justify-center text-xs">
            <Separator className="w-full" />
            <span className="bg-card text-muted-foreground absolute px-2">
              ou
            </span>
          </div>

          <form id="form-sign-in" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>E-mail</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="Digite seu email"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
                    <PasswordInput
                      {...field}
                      id="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Digite sua senha"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
          {form.formState.errors.root && (
            <FieldError errors={[form.formState.errors.root]} />
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            type="submit"
            form="form-sign-in"
            disabled={form.formState.isSubmitting || isGoogleLoading}
          >
            {form.formState.isSubmitting && (
              <Loader2Icon className="animate-spin" />
            )}
            Fazer login
          </Button>
        </CardFooter>
      </Card>
      <div className="flex items-center justify-center">
        <p className="text-center opacity-50">Ainda não possui uma conta? </p>
        <Button variant="link">
          <Link to="/signup">Crie agora</Link>
        </Button>
      </div>
    </div>
  );
};

export default SignInPage;
