import { ExternalLinkIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { Controller } from 'react-hook-form';

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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useEditEventForm } from '@/features/events/forms/hooks';

const EditEventButton = ({ event }) => {
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const { form, onSubmit } = useEditEventForm({
    event,
    onSuccess: () => {
      setSheetIsOpen(false);
      toast.add({
        type: 'success',
        title: 'Evento editado com sucesso!',
      });
    },
    onError: () => {
      toast.add({
        type: 'error',
        title: 'Ocorreu um erro ao editar o evento!',
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
          <SheetTitle>Editar Evento</SheetTitle>
        </SheetHeader>
        <form
          id="editEvent"
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
                    placeholder="Digite o nome do evento"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">
                    Descrição (opcional)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    aria-invalid={fieldState.invalid}
                    placeholder="Digite a descrição do evento"
                    autoComplete="off"
                    value={field.value ?? ''}
                    rows={3}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="startDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="startDate">Data inicial</FieldLabel>
                  <DatePicker
                    {...field}
                    id="startDate"
                    aria-invalid={fieldState.invalid}
                    placeholder="Selecione a data inicial"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="endDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="endDate">Data final</FieldLabel>
                  <DatePicker
                    {...field}
                    id="endDate"
                    aria-invalid={fieldState.invalid}
                    placeholder="Selecione a data final"
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
            form="editEvent"
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

export default EditEventButton;
