import {
  Loader2Icon,
  PiggyBankIcon,
  PlusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/date-picker';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { EventCombobox } from '@/features/events';
import { useCreateTransactionForm } from '@/features/transactions/forms/hooks';

const AddTransactionButton = ({
  initialEventId = null,
  open: controlledOpen,
  onOpenChange,
  trigger,
}) => {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogIsOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (open) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
  };

  const { form, onSubmit } = useCreateTransactionForm({
    initialEventId,
    onSuccess: () => {
      handleOpenChange(false);
      toast.add({
        type: 'success',
        description: 'Transação criada com sucesso.',
      });
    },
    onError: () => {
      handleOpenChange(false);
      toast.add({
        type: 'error',
        description:
          'Ocorreu um erro ao criar a transação. Por favor, tente novamente.',
      });
    },
  });

  useEffect(() => {
    if (dialogIsOpen) {
      form.reset({
        name: '',
        amount: 0,
        date: new Date(),
        type: 'EARNING',
        eventId: initialEventId ?? null,
      });
    }
  }, [dialogIsOpen, initialEventId, form]);

  return (
    <>
      <Dialog open={dialogIsOpen} onOpenChange={handleOpenChange}>
        {trigger !== null && (!isControlled || trigger) && (
          <DialogTrigger
            render={
              trigger ?? (
                <Button>
                  <PlusIcon />
                  Nova transação
                </Button>
              )
            }
          />
        )}
        <DialogContent className="sm:min-w-112.5">
          <DialogHeader>
            <DialogTitle>Adicionar Transação</DialogTitle>
            <DialogDescription>Insira as informações abaixo.</DialogDescription>
          </DialogHeader>
          <form
            id="addTransaction"
            className="space-y-8"
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
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="reset"
                  variant="secondary"
                  disabled={form.formState.isSubmitting}
                  className="w-full sm:w-1/2"
                  onClick={() => form.reset()}
                >
                  Cancelar
                </Button>
              }
            />
            <Button
              type="submit"
              form="addTransaction"
              disabled={form.formState.isSubmitting}
              className="w-full sm:w-1/2"
            >
              {form.formState.isSubmitting && (
                <Loader2Icon className="animate-spin" />
              )}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddTransactionButton;
