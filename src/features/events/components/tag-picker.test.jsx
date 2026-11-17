import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TagPicker } from '@/features/events/components/tag-picker';

describe('TagPicker (#144)', () => {
  const sampleTags = [
    { value: 'personal', label: 'Pessoal', dotClass: 'bg-emerald-400', isSystem: true },
    { id: 'tag-1', value: 'work', label: 'Trabalho', dotClass: 'bg-sky-400' },
    { id: 'tag-2', value: 'study', label: 'Estudos', dotClass: 'bg-indigo-400' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tag list with color dot and label', () => {
    render(<TagPicker tagOptions={sampleTags} />);

    expect(screen.getByText('Pessoal')).toBeInTheDocument();
    expect(screen.getByText('Trabalho')).toBeInTheDocument();
    expect(screen.getByText('Estudos')).toBeInTheDocument();
  });

  it('renders trash button inside the tag row to the left of the checkmark indicator', () => {
    render(
      <TagPicker
        tagOptions={sampleTags}
        isSelected={(opt) => opt.value === 'work'}
      />
    );

    const workRow = screen.getByRole('menuitemcheckbox', { name: /trabalho/i });
    const removeBtn = screen.getByRole('button', {
      name: /remover etiqueta trabalho/i,
    });
    const indicator = workRow.querySelector('[data-slot="tag-picker-indicator"]');

    // Trash button is inside the tag row
    expect(workRow).toContainElement(removeBtn);
    expect(workRow).toContainElement(indicator);

    // Trash button is to the left of the checkmark indicator in DOM order
    expect(removeBtn.compareDocumentPosition(indicator)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('does not render trash button for system tags', () => {
    render(<TagPicker tagOptions={sampleTags} />);

    expect(
      screen.queryByRole('button', { name: /remover etiqueta pessoal/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remover etiqueta trabalho/i })
    ).toBeInTheDocument();
  });

  it('invokes onToggleTag / onSelectTag when clicking a tag row', async () => {
    const user = userEvent.setup();
    const onToggleTag = vi.fn();
    const onSelectTag = vi.fn();

    render(
      <TagPicker
        tagOptions={sampleTags}
        isSelected={(opt) => opt.value === 'work'}
        onToggleTag={onToggleTag}
        onSelectTag={onSelectTag}
      />
    );

    await user.click(screen.getByText('Estudos'));

    expect(onToggleTag).toHaveBeenCalledWith('study', true, sampleTags[2]);
    expect(onSelectTag).toHaveBeenCalledWith('study', sampleTags[2]);
  });

  it('invokes onRemoveTag when clicking trash button without triggering row toggle', async () => {
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();
    const onToggleTag = vi.fn();

    render(
      <TagPicker
        tagOptions={sampleTags}
        onRemoveTag={onRemoveTag}
        onToggleTag={onToggleTag}
      />
    );

    const removeBtn = screen.getByRole('button', {
      name: /remover etiqueta trabalho/i,
    });

    await user.click(removeBtn);

    expect(onRemoveTag).toHaveBeenCalledWith('work', 'tag-1');
    expect(onToggleTag).not.toHaveBeenCalled();
  });

  it('adds a new tag via input and button click, clearing input', async () => {
    const user = userEvent.setup();
    const onAddTag = vi.fn();

    render(<TagPicker tagOptions={sampleTags} onAddTag={onAddTag} />);

    const input = screen.getByPlaceholderText('Nova etiqueta...');
    await user.type(input, 'Viagens');

    const addBtn = screen.getByRole('button', { name: /adicionar etiqueta/i });
    expect(addBtn).not.toBeDisabled();

    await user.click(addBtn);

    expect(onAddTag).toHaveBeenCalledWith('Viagens');
    expect(input).toHaveValue('');
  });

  it('adds a new tag when pressing Enter in the input', async () => {
    const user = userEvent.setup();
    const onAddTag = vi.fn();

    render(<TagPicker tagOptions={sampleTags} onAddTag={onAddTag} />);

    const input = screen.getByPlaceholderText('Nova etiqueta...');
    await user.type(input, 'Finanças{enter}');

    expect(onAddTag).toHaveBeenCalledWith('Finanças');
    expect(input).toHaveValue('');
  });

  it('displays error feedback when attempting to add a duplicate tag', async () => {
    const user = userEvent.setup();
    const onAddTag = vi.fn();

    render(<TagPicker tagOptions={sampleTags} onAddTag={onAddTag} />);

    const input = screen.getByPlaceholderText('Nova etiqueta...');
    await user.type(input, 'Trabalho{enter}');

    expect(onAddTag).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/já existe/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');

    // Clears error when typing again
    await user.type(input, ' Novo');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays error feedback when onAddTag throws or rejects', async () => {
    const user = userEvent.setup();
    const onAddTag = vi.fn().mockRejectedValue(new Error('Falha no servidor'));

    render(<TagPicker tagOptions={sampleTags} onAddTag={onAddTag} />);

    const input = screen.getByPlaceholderText('Nova etiqueta...');
    await user.type(input, 'Inovação{enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha no servidor');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders header slot when provided', () => {
    render(
      <TagPicker
        tagOptions={sampleTags}
        header={<div data-testid="custom-header">Todas as etiquetas</div>}
      />
    );

    expect(screen.getByTestId('custom-header')).toHaveTextContent(
      'Todas as etiquetas'
    );
  });
});
