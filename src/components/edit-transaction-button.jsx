import {
  ExternalLinkIcon,
  Loader2Icon,
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/date-picker';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import { EventCombobox } from '@/features/events';
import { useEditTransactionForm } from '@/forms/hooks/transaction';
const EditTransactionButton = ({ transaction }) => {
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const { form, onSubmit } = useEditTransactionForm({
    transaction,
    onSuccess: () => {
      setSheetIsOpen(false);
      toast.add({
        type: 'success',
        title: 'Transação editada com sucesso!',
      });
    },
    onError: () => {
      toast.add({
        type: 'error',
        title: 'Ocorreu um erro ao editar a transação!',
        description: 'Por favor tente novamente mais tarde.',
      });
    },
  });
  return (
    <Sheet open={sheetIsOpen} onOpenChange={setSheetIsOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon">
            <ExternalLinkIcon className="text-muted-foreground" />
          </Button>
        }
      />

      <SheetContent className="sm:min-w-112.5">
        <SheetHeader>
          <SheetTitle>Editar Transação</SheetTitle>
        </SheetHeader>
        <form
          id="editTransaction"
          className="space-y-4 px-2 sm:space-y-8 sm:px-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Nome</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Digite o nome da transação"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="amount">Valor</FieldLabel>
                  <NumericFormat
                    {...field}
                    placeholder="Digite o valor da transação"
                    thousandSeparator="."
                    decimalSeparator=","
                    id="amount"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    prefix="R$"
                    allowNegative={false}
                    customInput={Input}
                    onChange={() => {}}
                    onValueChange={(values) =>
                      field.onChange(values.floatValue)
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="date">Data</FieldLabel>
                  <DatePicker
                    {...field}
                    id="date"
                    aria-invalid={fieldState.invalid}
                    placeholder="Selecione a data da transação"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="eventId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eventId">Evento</FieldLabel>
                  <EventCombobox
                    id="eventId"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={form.formState.isSubmitting}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="type"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="type">Tipo</FieldLabel>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                    <Button
                      variant={
                        field.value === 'EARNING' ? 'secondary' : 'outline'
                      }
                      onClick={() => field.onChange('EARNING')}
                    >
                      <TrendingUpIcon className="text-primary-green" />
                      Ganho
                    </Button>
                    <Button
                      variant={
                        field.value === 'EXPENSE' ? 'secondary' : 'outline'
                      }
                      onClick={() => field.onChange('EXPENSE')}
                    >
                      <TrendingDownIcon className="text-primary-red" />
                      Gasto
                    </Button>
                    <Button
                      variant={
                        field.value === 'INVESTMENT' ? 'secondary' : 'outline'
                      }
                      onClick={() => field.onChange('INVESTMENT')}
                    >
                      <PiggyBankIcon className="text-primary-blue" />
                      Investimento
                    </Button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <SheetFooter>
          <SheetClose
            render={
              <Button
                type="reset"
                variant="secondary"
                disabled={form.formState.isSubmitting}
                className="w-full"
                onClick={() => form.reset()}
              >
                Cancelar
              </Button>
            }
          />
          <Button
            type="submit"
            form="editTransaction"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting && (
              <Loader2Icon className="animate-spin" />
            )}
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EditTransactionButton;
