import { Controller } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import DatePicker from '@/components/ui/date-picker';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import TimePicker from '@/components/ui/time-picker';

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
  const isAllDay = form.watch('allDay');

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
          name="allDay"
          control={form.control}
          render={({ field }) => (
            <Field>
              <div className="flex gap-1.5">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="eventAllDay"
                  disabled={form.formState.isSubmitting}
                />
                <FieldLabel
                  htmlFor="eventAllDay"
                  className="mb-0 cursor-pointer"
                >
                  Dia inteiro
                </FieldLabel>
              </div>
            </Field>
          )}
        />

        <div
          className={`grid w-full grid-cols-1 gap-4 ${!isAllDay ? 'sm:grid-cols-2' : ''}`}
        >
          <Controller
            name="startDate"
            className="w-full"
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {!isAllDay && (
            <Controller
              name="startTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eventStartTime">Hora inicial</FieldLabel>
                  <TimePicker
                    {...field}
                    id="eventStartTime"
                    disabled={form.formState.isSubmitting}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}
        </div>

        {/* --- ALTERAÇÃO AQUI: Grid condicional para a Data Final --- */}
        <div
          className={`grid w-full grid-cols-1 gap-4 ${!isAllDay ? 'sm:grid-cols-2' : ''}`}
        >
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {!isAllDay && (
            <Controller
              name="endTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eventEndTime">Hora final</FieldLabel>
                  <TimePicker
                    {...field}
                    id="eventEndTime"
                    disabled={form.formState.isSubmitting}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}
        </div>
      </FieldGroup>
    </form>
  );
};

export default EventForm;
