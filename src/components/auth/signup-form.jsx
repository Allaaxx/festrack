import { Loader2Icon } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Link } from 'react-router';

import GoogleIcon from '@/components/shared/google-icon';
import PasswordInput from '@/components/shared/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

/**
 * Modular Sign-Up Form component rendering name, email, password fields,
 * terms agreement, submit action, Google OAuth integration, and sign-in navigation.
 *
 * @param {Object} props
 * @param {import('react-hook-form').UseFormReturn} props.form - React Hook Form instance wired with signUpFormSchema.
 * @param {(data: { firstName: string, lastName: string, email: string, password: string, passwordConfirmation: string, terms: boolean }) => void | Promise<void>} props.onSubmit - Submission callback executed when registration data passes validation.
 * @param {boolean} props.isGoogleLoading - Flag indicating active Google OAuth redirect.
 * @param {() => void | Promise<void>} props.onGoogleSignIn - Callback to initiate Google OAuth handshake.
 * @param {any} [props.redirectState] - Preserved router location state passed to the sign-in switch link.
 * @param {{ state?: any }} [props.location] - Optional location object fallback for preserved router state.
 */
const SignupForm = ({
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
        <h1 className="text-2xl font-bold">Criar uma conta</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Preencha os campos abaixo para criar uma conta
        </p>
      </div>

      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="firstName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                <Input
                  {...field}
                  id="firstName"
                  aria-invalid={fieldState.invalid}
                  placeholder="Digite seu nome"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="lastName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Sobrenome</FieldLabel>
                <Input
                  {...field}
                  id="lastName"
                  aria-invalid={fieldState.invalid}
                  placeholder="Digite seu sobrenome"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

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

        <Controller
          name="passwordConfirmation"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirmação de senha</FieldLabel>
              <PasswordInput
                {...field}
                id="passwordConfirmation"
                aria-invalid={fieldState.invalid}
                placeholder="Digite sua senha novamente"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="terms"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  aria-invalid={fieldState.invalid}
                  className="mt-0.5"
                />
                <FieldLabel
                  htmlFor="terms"
                  className="text-muted-foreground text-xs leading-normal font-normal select-none"
                >
                  Ao clicar em &quot;Criar conta&quot;, você aceita{' '}
                  <a
                    href="#"
                    className="hover:text-primary underline underline-offset-4"
                  >
                    nosso termo de uso e política de privacidade.
                  </a>
                </FieldLabel>
              </div>
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
        Criar conta
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
        Já possui uma conta?{' '}
        <Link
          to="/signin"
          state={redirectState ?? location?.state}
          className="hover:text-primary underline underline-offset-4"
        >
          Faça login
        </Link>
      </div>
    </form>
  );
};

export default SignupForm;
