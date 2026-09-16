import { Loader2Icon } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Link, Navigate } from 'react-router';

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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/contexts/auth';
import { useSignUpForm } from '@/forms/hooks/auth';

const SignUpPage = () => {
  const { user, signup, isInitializing } = useAuthContext();
  const { form } = useSignUpForm();

  const handleSubmit = (data) => signup(data);

  if (isInitializing) return null;

  if (user) {
    return <Navigate to="/" />;
  }
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3">
      <Card className="w-2xs sm:w-full sm:max-w-lg">
        <CardHeader>
          <CardTitle>Criar uma conta</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para criar uma conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form id="form-sign-up" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
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
              <Controller
                name="passwordConfirmation"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Confirmação de senha
                    </FieldLabel>
                    <PasswordInput
                      {...field}
                      id="passwordConfirmation"
                      aria-invalid={fieldState.invalid}
                      placeholder="Digite sua senha novamente"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="terms"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FieldGroup data-slot="checkbox-group">
                    <Field
                      orientation="vertical"
                      data-invalid={fieldState.invalid}
                    >
                      <div className="flex gap-1.5 leading-none">
                        <Checkbox
                          id="terms"
                          name={field.name}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel
                          htmlFor="terms"
                          className={`text-xs opacity-75 ${!fieldState.invalid && 'text-muted-foreground '}`}
                        >
                          Ao clicar em "Criar conta", você aceita{' '}
                          <a
                            href="#"
                            className={`underline ${!fieldState.invalid && 'hidden text-white sm:block'}`}
                          >
                            nosso termo de uso e política de privacidade.
                          </a>
                        </FieldLabel>
                      </div>
                      <FieldLabel>
                        <a
                          href="#"
                          className={`underline ${!fieldState.invalid && 'block text-white sm:hidden'}`}
                        >
                          nosso termo de uso e política de privacidade.
                        </a>
                      </FieldLabel>
                    </Field>
                  </FieldGroup>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            type="submit"
            form="form-sign-up"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2Icon className="animate-spin" />
            )}
            Criar conta
          </Button>
        </CardFooter>
      </Card>

      <div className="flex items-center justify-center">
        <p className="text-center opacity-50">Já possui uma conta? </p>
        <Button variant="link">
          <Link to="/signin">Faça login</Link>
        </Button>
      </div>
    </div>
  );
};

export default SignUpPage;
