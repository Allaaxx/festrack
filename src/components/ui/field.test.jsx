import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';

describe('Field component', () => {
  it('does not apply text-destructive on the Field wrapper when data-invalid is true', () => {
    render(
      <Field data-invalid="true" data-testid="field-wrapper">
        <FieldLabel htmlFor="test-input">Nome</FieldLabel>
        <FieldError errors={[{ message: 'Campo obrigatório' }]} />
      </Field>
    );

    const fieldWrapper = screen.getByTestId('field-wrapper');
    expect(fieldWrapper).not.toHaveClass(
      'data-[invalid=true]:text-destructive'
    );

    const label = screen.getByText('Nome');
    expect(label).not.toHaveClass('text-destructive');

    const error = screen.getByText('Campo obrigatório');
    expect(error).toHaveClass('text-destructive');
  });
});
