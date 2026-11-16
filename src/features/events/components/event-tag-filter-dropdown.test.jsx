import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_EVENT_TAGS,
  EventTagFilterDropdown,
} from '@/features/events/components/event-tag-filter-dropdown';

describe('EventTagFilterDropdown (#132)', () => {
  const defaultProps = {
    showAllTypes: true,
    selectedTypes: [],
    eventTypeOptions: [
      ...DEFAULT_EVENT_TAGS,
      { value: 'custom-tag', label: 'Custom Tag', dotClass: 'bg-indigo-400' },
    ],
    onSetShowAllTypes: vi.fn(),
    onToggleTypeFilter: vi.fn(),
    onAddEventTypeOption: vi.fn(),
    onRemoveEventTypeOption: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button with aria-label and opens menu on click', async () => {
    const user = userEvent.setup();
    render(<EventTagFilterDropdown {...defaultProps} />);

    const trigger = screen.getByRole('button', {
      name: /filtro de etiquetas/i,
    });
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByText('Filtro de etiquetas')).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Família')).toBeInTheDocument();
    expect(screen.getByText('Negócios')).toBeInTheDocument();
    expect(screen.getByText('Pessoal')).toBeInTheDocument();
    expect(screen.getByText('Feriado')).toBeInTheDocument();
    expect(screen.getByText('Outros')).toBeInTheDocument();
    expect(screen.getByText('Custom Tag')).toBeInTheDocument();
  });

  it('invokes onSetShowAllTypes when clicking Todas', async () => {
    const user = userEvent.setup();
    render(<EventTagFilterDropdown {...defaultProps} showAllTypes={false} />);

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );
    const todasOption = await screen.findByText('Todas');
    await user.click(todasOption);

    expect(defaultProps.onSetShowAllTypes).toHaveBeenCalledWith(true);
  });

  it('invokes onToggleTypeFilter when selecting a tag option', async () => {
    const user = userEvent.setup();
    render(
      <EventTagFilterDropdown
        {...defaultProps}
        showAllTypes={false}
        selectedTypes={['family']}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );
    const negocioOption = await screen.findByText('Negócios');
    await user.click(negocioOption);

    expect(defaultProps.onToggleTypeFilter).toHaveBeenCalledWith(
      'business',
      true
    );
  });

  it('adds a new custom tag when typing in input and clicking add button', async () => {
    const user = userEvent.setup();
    render(<EventTagFilterDropdown {...defaultProps} />);

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );

    const input = await screen.findByPlaceholderText('Nova etiqueta...');
    await user.type(input, 'Viagens');

    const addBtn = screen.getByRole('button', { name: /adicionar etiqueta/i });
    await user.click(addBtn);

    expect(defaultProps.onAddEventTypeOption).toHaveBeenCalledWith('Viagens');
  });

  it('renders trash button only for non-default tags and invokes onRemoveEventTypeOption', async () => {
    const user = userEvent.setup();
    render(<EventTagFilterDropdown {...defaultProps} />);

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );

    const removeBtn = await screen.findByRole('button', {
      name: /remover etiqueta custom tag/i,
    });
    expect(removeBtn).toBeInTheDocument();

    // Default tag should not have a remove button
    expect(
      screen.queryByRole('button', { name: /remover etiqueta família/i })
    ).not.toBeInTheDocument();

    await user.click(removeBtn);
    expect(defaultProps.onRemoveEventTypeOption).toHaveBeenCalledWith(
      'custom-tag'
    );
  });

  it('supports canonical domain naming props (tagOptions, onToggleTagFilter, etc.)', async () => {
    const user = userEvent.setup();
    const onSetShowAllTags = vi.fn();
    const onToggleTagFilter = vi.fn();
    const onAddTagOption = vi.fn();
    const onRemoveTagOption = vi.fn();

    render(
      <EventTagFilterDropdown
        showAllTags={false}
        selectedTags={['family']}
        tagOptions={[
          ...DEFAULT_EVENT_TAGS,
          {
            value: 'custom-tag',
            label: 'Custom Tag',
            dotClass: 'bg-indigo-400',
          },
        ]}
        onSetShowAllTags={onSetShowAllTags}
        onToggleTagFilter={onToggleTagFilter}
        onAddTagOption={onAddTagOption}
        onRemoveTagOption={onRemoveTagOption}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /filtro de etiquetas/i })
    );

    const negocioOption = await screen.findByText('Negócios');
    await user.click(negocioOption);
    expect(onToggleTagFilter).toHaveBeenCalledWith('business', true);

    const todasOption = screen.getByText('Todas');
    await user.click(todasOption);
    expect(onSetShowAllTags).toHaveBeenCalledWith(true);
  });
});
