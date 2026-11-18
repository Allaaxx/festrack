import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TagPicker } from '@/features/events/components/tag-picker';

describe('TagPicker', () => {
  const sampleTags = [
    {
      id: 'tag-0',
      value: 'family',
      label: 'Família',
      dotClass: 'bg-amber-400',
    },
    { id: 'tag-1', value: 'work', label: 'Trabalho', dotClass: 'bg-sky-400' },
    {
      id: 'tag-2',
      value: 'study',
      label: 'Estudos',
      dotClass: 'bg-indigo-400',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tag list with color dot and label', () => {
    render(<TagPicker tagOptions={sampleTags} />);

    expect(screen.getByText('Família')).toBeInTheDocument();
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
    const indicator = workRow.querySelector(
      '[data-slot="tag-picker-indicator"]'
    );

    // Trash button is inside the tag row
    expect(workRow).toContainElement(removeBtn);
    expect(workRow).toContainElement(indicator);

    // Trash button is to the left of the checkmark indicator in DOM order
    expect(removeBtn.compareDocumentPosition(indicator)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('allows deleting all shop tags including legacy slugs like family, business, etc by default', () => {
    const tags = [
      { id: '1', value: 'family', label: 'Família', dotClass: 'bg-indigo-400' },
      {
        id: '2',
        value: 'business',
        label: 'Negócios',
        dotClass: 'bg-teal-400',
      },
      {
        id: '3',
        value: 'etc',
        label: 'Outros',
        dotClass: 'bg-orange-400',
        isSystem: true,
      },
    ];
    render(<TagPicker tagOptions={tags} />);

    expect(
      screen.getByRole('button', { name: /remover etiqueta família/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remover etiqueta negócios/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remover etiqueta outros/i })
    ).toBeInTheDocument();
  });

  it('hides trash buttons when canDeleteTag returns false', () => {
    render(<TagPicker tagOptions={sampleTags} canDeleteTag={() => false} />);

    expect(
      screen.queryByRole('button', { name: /remover etiqueta/i })
    ).not.toBeInTheDocument();
  });

  it('applies menu + aria-checked for menuitemcheckbox and listbox + aria-selected for option', () => {
    const { rerender } = render(
      <TagPicker
        tagOptions={sampleTags}
        itemRole="menuitemcheckbox"
        isSelected={(opt) => opt.value === 'work'}
      />
    );

    expect(screen.getByRole('menu')).toBeInTheDocument();
    const menuItem = screen.getByRole('menuitemcheckbox', {
      name: /trabalho/i,
    });
    expect(menuItem).toHaveAttribute('aria-checked', 'true');
    expect(menuItem).not.toHaveAttribute('aria-selected');

    rerender(
      <TagPicker
        tagOptions={sampleTags}
        itemRole="option"
        isSelected={(opt) => opt.value === 'work'}
      />
    );

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    const optionItem = screen.getByRole('option', { name: /trabalho/i });
    expect(optionItem).toHaveAttribute('aria-selected', 'true');
    expect(optionItem).not.toHaveAttribute('aria-checked');
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

  it('preserves input value when onAddTag returns false or rejects', async () => {
    const user = userEvent.setup();
    const onAddTagFalse = vi.fn().mockResolvedValue(false);

    const { rerender } = render(
      <TagPicker tagOptions={sampleTags} onAddTag={onAddTagFalse} />
    );

    const input = screen.getByPlaceholderText('Nova etiqueta...');
    await user.type(input, 'Falha Silenciosa{enter}');

    expect(onAddTagFalse).toHaveBeenCalledWith('Falha Silenciosa');
    expect(input).toHaveValue('Falha Silenciosa');

    const onAddTagReject = vi
      .fn()
      .mockRejectedValue(new Error('Falha no servidor'));
    rerender(<TagPicker tagOptions={sampleTags} onAddTag={onAddTagReject} />);

    await user.clear(input);
    await user.type(input, 'Inovação{enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha no servidor'
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveValue('Inovação');
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
