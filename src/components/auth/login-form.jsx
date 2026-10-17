import { Loader2Icon } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Link } from 'react-router';

import GoogleIcon from '@/components/shared/google-icon';
import PasswordInput from '@/components/shared/password-input';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

/**
 * Modular Sign-In Form component rendering credentials fields, submit action,
 * Google OAuth integration, and registration navigation.
 *
 * @param {Object} props
 * @param {import('react-hook-form').UseFormReturn} props.form - React Hook Form instance wired with signInFormSchema.
 * @param {(data: { email: string, password: string }) => void | Promise<void>} props.onSubmit - Submission callback executed when credentials pass validation.
 * @param {boolean} props.isGoogleLoading - Flag indicating active Google OAuth redirect.
 * @param {() => void | Promise<void>} props.onGoogleSignIn - Callback to initiate Google OAuth handshake.
 * @param {any} [props.redirectState] - Preserved router location state passed to the registration switch link.
 * @param {{ state?: any }} [props.location] - Optional location object fallback for preserved router state.
 */
const LoginForm = ({
  form,
  onSubmit,
  isGoogleLoading,
  onGoogleSignIn,
  redirectState,
  location,
}) => {

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Entre na sua conta</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Insira seus dados abaixo.
        </p>
      </div>

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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {form.formState.errors.root && (
        <FieldError errors={[form.formState.errors.root]} />
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting || isGoogleLoading}
      >
        {form.formState.isSubmitting && (
          <Loader2Icon className="animate-spin" />
        )}
        Fazer login
      </Button>

      <div className="relative flex items-center justify-center text-xs">
        <Separator className="w-full" />
        <span className="bg-background text-muted-foreground absolute px-2">
          ou
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={onGoogleSignIn}
        disabled={isGoogleLoading || form.formState.isSubmitting}
      >
        {isGoogleLoading ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continuar com Google
      </Button>

      <div className="text-muted-foreground text-center text-sm">
        Ainda não possui uma conta?{' '}
        <Link
          to="/signup"
          state={redirectState ?? location?.state}
          className="hover:text-primary underline underline-offset-4"
        >
          Crie agora
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
