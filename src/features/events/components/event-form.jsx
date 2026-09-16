import { Controller } from 'react-hook-form';

import DatePicker from '@/components/ui/date-picker';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

/**
 * Formulário de campos de evento, reutilizável entre criação e edição.
 *
 * @param {{
 *   form: import('react-hook-form').UseFormReturn,
 *   onSubmit: (data: object) => void,
 *   formId: string,
 * }} props
 */
const EventForm = ({ form, onSubmit, formId }) => {
  return (
    <form
      id={formId}
      className="space-y-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="eventName">Nome do evento</FieldLabel>
              <Input
                {...field}
                id="eventName"
                aria-invalid={fieldState.invalid}
                placeholder="Ex: Viagem de férias, Bônus anual..."
                autoComplete="off"
                disabled={form.formState.isSubmitting}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="eventDescription">
                Descrição (opcional)
              </FieldLabel>
              <Textarea
                {...field}
                id="eventDescription"
                aria-invalid={fieldState.invalid}
                placeholder="Descreva o objetivo ou detalhe do evento..."
                autoComplete="off"
                disabled={form.formState.isSubmitting}
                value={field.value ?? ''}
                rows={3}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="startDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="eventStartDate">Data inicial</FieldLabel>
              <DatePicker
                {...field}
                id="eventStartDate"
                aria-invalid={fieldState.invalid}
                placeholder="Selecione a data de início"
                disabled={form.formState.isSubmitting}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="endDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="eventEndDate">Data final</FieldLabel>
              <DatePicker
                {...field}
                id="eventEndDate"
                aria-invalid={fieldState.invalid}
                placeholder="Selecione a data de encerramento"
                disabled={form.formState.isSubmitting}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
};

export default EventForm;
